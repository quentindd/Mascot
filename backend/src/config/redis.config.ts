import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SharedBullConfigurationFactory, BullRootModuleOptions } from '@nestjs/bullmq';

@Injectable()
export class RedisConfig implements SharedBullConfigurationFactory {
  constructor(private configService: ConfigService) {}

  createSharedConfiguration(): BullRootModuleOptions {
    let host = this.configService.get<string>('REDIS_HOST');
    let port = this.configService.get<string | number>('REDIS_PORT', 6379);
    let password = this.configService.get<string>('REDIS_PASSWORD');

    // Railway (and others) often provide a single REDIS_URL
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        const u = new URL(redisUrl);
        host = u.hostname;
        port = u.port ? parseInt(u.port, 10) : 6379;
        password = u.password || undefined;
      } catch {
        console.warn('[RedisConfig] REDIS_URL invalid, using REDIS_HOST/PORT/PASSWORD');
      }
    }

    const portNum = typeof port === 'string' ? parseInt(port, 10) : port;

    console.log('[RedisConfig] Redis configuration:', {
      host: host || 'NOT SET (will use localhost)',
      port: portNum,
      hasPassword: !!password,
      fromUrl: !!redisUrl,
    });

    if (!host) {
      console.warn('[RedisConfig] REDIS_HOST (or REDIS_URL) not set. BullMQ will try localhost.');
    }

    return {
      connection: {
        host: host || 'localhost',
        port: portNum,
        password: password || undefined,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          console.log(`[RedisConfig] Retrying connection (attempt ${times}), delay: ${delay}ms`);
          return delay;
        },
        maxRetriesPerRequest: null,
      },
    };
  }
}
