import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SharedBullConfigurationFactory, BullRootModuleOptions } from '@nestjs/bullmq';

@Injectable()
export class RedisConfig implements SharedBullConfigurationFactory {
  constructor(private configService: ConfigService) {}

  createSharedConfiguration(): BullRootModuleOptions {
    const host = this.configService.get('REDIS_HOST');
    const port = this.configService.get('REDIS_PORT', 6379);
    const password = this.configService.get('REDIS_PASSWORD');

    // Log configuration for debugging
    console.log('[RedisConfig] Redis configuration:', {
      host: host || 'NOT SET (will use localhost)',
      port,
      hasPassword: !!password,
    });

    if (!host) {
      console.warn('[RedisConfig] REDIS_HOST not set. BullMQ will try to connect to localhost, which will fail in production.');
    }

    return {
      connection: {
        host: host || 'localhost',
        port: typeof port === 'string' ? parseInt(port, 10) : port,
        password: password || undefined,
        // Add connection retry strategy
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          console.log(`[RedisConfig] Retrying connection (attempt ${times}), delay: ${delay}ms`);
          return delay;
        },
        // BullMQ requires maxRetriesPerRequest to be null
        maxRetriesPerRequest: null,
      },
    };
  }
}
