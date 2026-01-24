import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogosController } from './logos.controller';
import { LogosService } from './logos.service';
import { LogoPack } from '../../entities/logo-pack.entity';
import { CreditsModule } from '../credits/credits.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogoPack]),
    CreditsModule,
    JobsModule,
  ],
  controllers: [LogosController],
  providers: [LogosService],
  exports: [LogosService],
})
export class LogosModule {}
