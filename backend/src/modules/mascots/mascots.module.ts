import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MascotsController } from './mascots.controller';
import { MascotsService } from './mascots.service';
import { AutoFillService } from './auto-fill.service';
import { CodeSnippetService } from './code-snippet.service';
import { Mascot } from '../../entities/mascot.entity';
import { GenerationJob } from '../../entities/generation-job.entity';
import { AnimationJob } from '../../entities/animation-job.entity';
import { LogoPack } from '../../entities/logo-pack.entity';
import { Pose } from '../../entities/pose.entity';
import { CreditsModule } from '../credits/credits.module';
import { StorageModule } from '../storage/storage.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mascot, GenerationJob, AnimationJob, LogoPack, Pose]),
    CreditsModule,
    StorageModule,
    JobsModule,
  ],
  controllers: [MascotsController],
  providers: [MascotsService, AutoFillService, CodeSnippetService],
  exports: [MascotsService],
})
export class MascotsModule {}
