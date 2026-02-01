import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { MascotGenerationProcessor } from './processors/mascot-generation.processor';
import { AnimationGenerationProcessor } from './processors/animation-generation.processor';
import { PoseGenerationProcessor } from './processors/pose-generation.processor';
import { AIModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';
import { CreditsModule } from '../credits/credits.module';
import { Mascot } from '../../entities/mascot.entity';
import { AnimationJob } from '../../entities/animation-job.entity';
import { Pose } from '../../entities/pose.entity';

@Module({
  imports: [
    BullModule.registerQueue(
      { 
        name: 'mascot-generation',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
      { 
        name: 'animation-generation',
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
        },
      },
      { 
        name: 'pose-generation',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
    ),
    TypeOrmModule.forFeature([Mascot, AnimationJob, Pose]),
    AIModule,
    StorageModule,
    CreditsModule,
  ],
  providers: [
    JobsService,
    MascotGenerationProcessor,
    AnimationGenerationProcessor,
    PoseGenerationProcessor,
  ],
  exports: [JobsService],
})
export class JobsModule {}
