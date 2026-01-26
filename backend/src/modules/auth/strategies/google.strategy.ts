import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {
    const clientID = configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get('GOOGLE_CALLBACK_URL') || '/api/v1/auth/google/callback';

    // Log configuration (without secrets)
    console.log('[GoogleStrategy] Initializing with:', {
      hasClientID: !!clientID,
      hasClientSecret: !!clientSecret,
      callbackURL,
    });

    if (!clientID || !clientSecret) {
      console.warn('[GoogleStrategy] Google OAuth credentials not configured. Google OAuth will not work.');
      console.warn('[GoogleStrategy] Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Railway.');
    }

    super({
      clientID: clientID || 'dummy', // Dummy value to prevent crash, but OAuth won't work
      clientSecret: clientSecret || 'dummy',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    const email = emails[0]?.value;
    const displayName = name?.givenName + ' ' + name?.familyName || name?.displayName || email;
    const avatarUrl = photos[0]?.value;

    // Find or create user
    let user = await this.userRepository.findOne({
      where: [{ googleId: id }, { email }],
    });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = id;
        await this.userRepository.save(user);
      }
      // Update avatar if available
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
        await this.userRepository.save(user);
      }
    } else {
      // Create new user
      user = this.userRepository.create({
        googleId: id,
        email,
        name: displayName,
        avatarUrl,
        passwordHash: '', // No password for OAuth users
        isActive: true,
      });
      user = await this.userRepository.save(user);

      // Give initial credits
      await this.authService.giveInitialCredits(user.id);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return user;
  }
}
