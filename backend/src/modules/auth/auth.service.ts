import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserPlan } from '../../entities/user.entity';
import { RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { CreditsService } from '../credits/credits.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private creditsService: CreditsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash,
      name: registerDto.name,
      plan: UserPlan.FREE,
      creditBalance: 100, // Free tier: 100 credits for testing
    });

    const saved = await this.userRepository.save(user);

    return this.generateAuthResponse(saved);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    // OAuth users don't have passwordHash
    if (!user || !user.passwordHash) {
      return null;
    }
    if (await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any): Promise<AuthResponseDto> {
    const fullUser = await this.userRepository.findOne({
      where: { id: user.id },
    });

    // Update last login
    fullUser.lastLoginAt = new Date();
    await this.userRepository.save(fullUser);

    return this.generateAuthResponse(fullUser);
  }

  async giveInitialCredits(userId: string): Promise<void> {
    // Give initial credits to new users
    await this.creditsService.addCredits(userId, 100, 'Initial signup bonus');
  }

  private generateAuthResponse(user: User): AuthResponseDto {
    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        creditBalance: user.creditBalance,
      },
    };
  }
}
