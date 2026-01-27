import { Module } from '@nestjs/common';
import { Imagen4Service } from './imagen4.service';
import { GeminiFlashService } from './gemini-flash.service';
import { RunwayService } from './runway.service';

@Module({
  providers: [Imagen4Service, GeminiFlashService, RunwayService],
  exports: [Imagen4Service, GeminiFlashService, RunwayService],
})
export class AIModule {}
