import { Module } from '@nestjs/common';
import { Imagen4Service } from './imagen4.service';
import { GeminiFlashService } from './gemini-flash.service';

@Module({
  providers: [Imagen4Service, GeminiFlashService],
  exports: [Imagen4Service, GeminiFlashService],
})
export class AIModule {}
