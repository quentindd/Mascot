import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosesService } from './poses.service';
import { PosesController } from './poses.controller';
import { Pose } from '../../entities/pose.entity';
import { Mascot } from '../../entities/mascot.entity';
import { CreditsModule } from '../credits/credits.module';
import { JobsModule } from '../jobs/jobs.module';
import { AIModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pose, Mascot]),
    CreditsModule,
    JobsModule,
    AIModule,
    StorageModule,
  ],
  controllers: [PosesController],
  providers: [PosesService],
  exports: [PosesService],
})
export class PosesModule {}
