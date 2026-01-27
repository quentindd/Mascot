import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Workspace } from '../entities/workspace.entity';
import { WorkspaceMember } from '../entities/workspace-member.entity';
import { CreditLedger } from '../entities/credit-ledger.entity';
import { Mascot } from '../entities/mascot.entity';
import { AnimationJob } from '../entities/animation-job.entity';
import { LogoPack } from '../entities/logo-pack.entity';
import { GenerationJob } from '../entities/generation-job.entity';
import { Pose } from '../entities/pose.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_DATABASE'),
      entities: [
        User,
        Workspace,
        WorkspaceMember,
        CreditLedger,
        Mascot,
        AnimationJob,
        LogoPack,
        GenerationJob,
        Pose,
      ],
      synchronize: true, // Force table creation in production (temporary)
      logging: this.configService.get('NODE_ENV') === 'development',
      migrations: ['dist/migrations/*.js'],
      migrationsRun: false,
    };
  }
}
