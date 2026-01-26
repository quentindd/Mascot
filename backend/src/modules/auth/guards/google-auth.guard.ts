import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  canActivate(context: ExecutionContext) {
    this.logger.log('GoogleAuthGuard.canActivate called');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err) {
      this.logger.error('GoogleAuthGuard error:', err);
      throw err;
    }
    if (info) {
      this.logger.warn('GoogleAuthGuard info:', info);
    }
    if (!user) {
      this.logger.warn('GoogleAuthGuard: No user found');
    }
    return super.handleRequest(err, user, info, context);
  }
}
