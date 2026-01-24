import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimationsController } from './animations.controller';
import { AnimationsService } from './animations.service';
import { AnimationJob } from '../../entities/animation-job.entity';
import { CreditsModule } from '../credits/credits.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnimationJob]),
    CreditsModule,
    JobsModule,
  ],
  controllers: [AnimationsController],
  providers: [AnimationsService],
  exports: [AnimationsService],
})
export class AnimationsModule {}
