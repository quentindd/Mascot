import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { MascotGenerationProcessor } from './processors/mascot-generation.processor';
import { AnimationGenerationProcessor } from './processors/animation-generation.processor';
import { LogoPackGenerationProcessor } from './processors/logo-pack-generation.processor';
import { AIModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';
import { CreditsModule } from '../credits/credits.module';
import { Mascot } from '../../entities/mascot.entity';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'mascot-generation' },
      { name: 'animation-generation' },
      { name: 'logo-pack-generation' },
    ),
    TypeOrmModule.forFeature([Mascot]),
    AIModule,
    StorageModule,
    CreditsModule,
  ],
  providers: [
    JobsService,
    MascotGenerationProcessor,
    AnimationGenerationProcessor,
    LogoPackGenerationProcessor,
  ],
  exports: [JobsService],
})
export class JobsModule {}
