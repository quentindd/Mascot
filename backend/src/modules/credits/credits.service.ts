import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreditLedger, CreditTransactionType, CreditTransactionStatus } from '../../entities/credit-ledger.entity';
import { User } from '../../entities/user.entity';

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
    const exempt = this.configService.get<string>('CREDITS_EXEMPT_EMAIL');
    if (!exempt || !exempt.trim()) return false;
    const emails = exempt.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    return emails.includes((user.email || '').toLowerCase());
  }

  async checkAndReserveCredits(userId: string, amount: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

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
    const subscriptionPlanId = user.stripeSubscriptionMetadata?.planId ?? null;
    return {
      balance: user.creditBalance,
      plan: user.plan,
      subscriptionPlanId: subscriptionPlanId as string | null, // 'basic' | 'pro' | 'max' when subscribed
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
   * Add credits to a user (purchase, subscription grant, admin, etc.).
   * @param referenceId Optional idempotency key (e.g. Stripe subscription id) – if set and already exists for this type, no-op.
   * @returns true if credits were added, false if skipped (idempotent).
   */
  async addCredits(
    userId: string,
    amount: number,
    description?: string,
    referenceId?: string,
    type: CreditTransactionType = CreditTransactionType.PURCHASE,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (referenceId) {
      const existing = await this.ledgerRepository.findOne({
        where: {
          userId,
          referenceId,
          type: In([CreditTransactionType.PURCHASE, CreditTransactionType.SUBSCRIPTION_GRANT]),
        },
      });
      if (existing) {
        return false; // Already processed (idempotent)
      }
    }

    const ledger = this.ledgerRepository.create({
      userId,
      type,
      amount,
      balanceAfter: user.creditBalance + amount,
      status: CreditTransactionStatus.COMPLETED,
      description: description || `Added ${amount} credits`,
      referenceId: referenceId ?? undefined,
    });

    await this.ledgerRepository.save(ledger);

    user.creditBalance += amount;
    await this.userRepository.save(user);
    return true;
  }
}
