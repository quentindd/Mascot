import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimationsController } from './animations.controller';
import { AnimationsService } from './animations.service';
import { AnimationJob } from '../../entities/animation-job.entity';
import { AIModule } from '../ai/ai.module';
import { CreditsModule } from '../credits/credits.module';
import { JobsModule } from '../jobs/jobs.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnimationJob]),
    AIModule,
    CreditsModule,
    JobsModule,
    StorageModule,
  ],
  controllers: [AnimationsController],
  providers: [AnimationsService],
  exports: [AnimationsService],
})
export class AnimationsModule {}
