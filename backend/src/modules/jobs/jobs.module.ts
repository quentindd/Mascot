import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobsService } from './jobs.service';
import { MascotGenerationProcessor } from './processors/mascot-generation.processor';
import { AnimationGenerationProcessor } from './processors/animation-generation.processor';
import { LogoPackGenerationProcessor } from './processors/logo-pack-generation.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'mascot-generation' },
      { name: 'animation-generation' },
      { name: 'logo-pack-generation' },
    ),
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
