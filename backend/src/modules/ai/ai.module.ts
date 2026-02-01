import { Module } from '@nestjs/common';
import { Imagen4Service } from './imagen4.service';
import { GeminiFlashService } from './gemini-flash.service';
import { RunwayService } from './runway.service';
import { ReplicateService } from './replicate.service';
import { OpenAIImageService } from './openai-image.service';

@Module({
  providers: [Imagen4Service, GeminiFlashService, RunwayService, ReplicateService, OpenAIImageService],
  exports: [Imagen4Service, GeminiFlashService, RunwayService, ReplicateService, OpenAIImageService],
})
export class AIModule {}
