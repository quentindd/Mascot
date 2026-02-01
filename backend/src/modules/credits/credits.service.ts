import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditLedger, CreditTransactionType, CreditTransactionStatus } from '../../entities/credit-ledger.entity';
import { User } from '../../entities/user.entity';

/** Emails that are exempt from credit deduction (e.g. owner account). Override with CREDITS_EXEMPT_EMAIL env. */
const DEFAULT_EXEMPT_EMAIL = 'dimpre.quentin@gmail.com';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(CreditLedger)
    private ledgerRepository: Repository<CreditLedger>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  private isExemptFromCredits(user: User): boolean {
    const exempt = this.configService.get<string>('CREDITS_EXEMPT_EMAIL') || DEFAULT_EXEMPT_EMAIL;
    const emails = exempt.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    return emails.includes((user.email || '').toLowerCase());
  }

  async checkAndReserveCredits(userId: string, amount: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    // Exempt account: no deduction, always allow
    if (this.isExemptFromCredits(user)) {
      return true;
    }

    if (user.creditBalance < amount) {
      return false;
    }

    // Reserve credits (create pending transaction)
    const ledger = this.ledgerRepository.create({
      userId,
      type: CreditTransactionType.USAGE,
      amount: -amount,
      balanceAfter: user.creditBalance - amount,
      status: CreditTransactionStatus.PENDING,
      description: `Reserved ${amount} credits`,
    });

    await this.ledgerRepository.save(ledger);

    // Update user balance
    user.creditBalance -= amount;
    await this.userRepository.save(user);

    return true;
  }

  async getBalance(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return {
      balance: user.creditBalance,
      plan: user.plan,
      creditsLastResetAt: user.creditsLastResetAt,
      monthlyAllowance: this.getMonthlyAllowance(user.plan),
    };
  }

  private getMonthlyAllowance(plan: string): number {
    const allowances = {
      free: 1,
      creator: 50,
      studio: 200,
      agency: 500,
    };
    return allowances[plan] || 0;
  }

  /**
   * Add credits to a user (admin function)
   */
  async addCredits(userId: string, amount: number, description?: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Create ledger entry
    const ledger = this.ledgerRepository.create({
      userId,
      type: CreditTransactionType.PURCHASE, // or MANUAL
      amount: amount,
      balanceAfter: user.creditBalance + amount,
      status: CreditTransactionStatus.COMPLETED,
      description: description || `Added ${amount} credits manually`,
    });

    await this.ledgerRepository.save(ledger);

    // Update user balance
    user.creditBalance += amount;
    await this.userRepository.save(user);
  }
}
