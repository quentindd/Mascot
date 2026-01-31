import { Controller, Post, Body, UseGuards, Request, Get, Res, Req, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {
    this.logger.log('AuthController initialized - Google OAuth routes should be available');
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  async login(@Request() req, @Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }

  @Get('google/test')
  @ApiOperation({ summary: 'Test Google OAuth route registration' })
  async googleAuthTest() {
    this.logger.log('✅ Google OAuth test route is accessible');
    return { message: 'Google OAuth route is registered', timestamp: new Date().toISOString() };
  }

  @Get('google/debug')
  @ApiOperation({ summary: 'Debug Google OAuth strategy availability' })
  async googleAuthDebug() {
    // Try to check if the strategy is available
    try {
      const passport = require('passport');
      const strategies = Object.keys(passport._strategies || {});
      this.logger.log(`Available Passport strategies: ${strategies.join(', ')}`);
      return {
        message: 'Google OAuth debug info',
        availableStrategies: strategies,
        hasGoogleStrategy: strategies.includes('google'),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error checking strategies:', error);
      return {
        message: 'Error checking strategies',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth' })
  async googleAuth(@Req() req) {
    // Guard redirects to Google - this handler should never be reached
    // as Passport redirects before the handler runs
    this.logger.log('googleAuth handler called (should not happen - Passport should redirect)');
    this.logger.log(`Request URL: ${req.url}`);
    this.logger.log(`Request method: ${req.method}`);
    return { message: 'This should not be reached - Passport should redirect to Google' };
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    console.log('[AuthController] googleAuthCallback called');
    const user = req.user;
    const authResponse = await this.authService.login(user);
    const code = this.authService.generateOneTimeCode(authResponse.accessToken);

    // Page shows only a 6-digit code; user enters it in the Figma plugin (no token visible)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Mascot - Sign in successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 360px;
    }
    h1 { color: #18a0fb; margin-bottom: 16px; font-size: 22px; }
    p { color: #666; margin-bottom: 24px; font-size: 15px; line-height: 1.5; }
    .code {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 8px;
      padding: 16px 24px;
      background: #f0f7ff;
      border-radius: 8px;
      margin: 24px 0;
      color: #18a0fb;
    }
    .hint { font-size: 13px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✅ You're signed in</h1>
    <p>Close this window and return to Figma. In the plugin, enter this code:</p>
    <div class="code">${code}</div>
    <p class="hint">The code is valid for 5 minutes.</p>
  </div>
</body>
</html>
    `;

    res.send(html);
  }

  @Post('exchange-code')
  @ApiOperation({ summary: 'Exchange one-time code for access token (Figma plugin)' })
  async exchangeCode(@Body() body: { code: string }) {
    const code = typeof body?.code === 'string' ? body.code.trim() : '';
    if (!code) {
      throw new BadRequestException('Code is required');
    }
    const token = this.authService.exchangeCodeForToken(code);
    return { accessToken: token };
  }
}
