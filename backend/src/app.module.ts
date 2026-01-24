import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { MascotsModule } from './modules/mascots/mascots.module';
import { AnimationsModule } from './modules/animations/animations.module';
import { LogosModule } from './modules/logos/logos.module';
import { CreditsModule } from './modules/credits/credits.module';
import { BillingModule } from './modules/billing/billing.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { StorageModule } from './modules/storage/storage.module';
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    // Redis & BullMQ
    BullModule.forRootAsync({
      useClass: RedisConfig,
    }),
    // Feature modules
    AuthModule,
    UsersModule,
    WorkspacesModule,
    MascotsModule,
    AnimationsModule,
    LogosModule,
    CreditsModule,
    BillingModule,
    JobsModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
