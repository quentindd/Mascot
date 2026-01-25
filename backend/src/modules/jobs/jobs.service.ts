import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('mascot-generation')
    private mascotQueue: Queue,
    @InjectQueue('animation-generation')
    private animationQueue: Queue,
    @InjectQueue('logo-pack-generation')
    private logoPackQueue: Queue,
  ) {}

  async enqueueMascotGeneration(mascotId: string, data: any) {
    try {
      await this.mascotQueue.add('generate', { mascotId, ...data });
    } catch (error) {
      console.error(`[JobsService] Failed to enqueue mascot generation for ${mascotId}:`, error);
      // Re-throw to let the caller handle it
      throw error;
    }
  }

  async enqueueAnimationGeneration(animationId: string, mascotId: string, data: any) {
    await this.animationQueue.add('generate', { animationId, mascotId, ...data });
  }

  async enqueueLogoPackGeneration(logoPackId: string, mascotId: string, data: any) {
    await this.logoPackQueue.add('generate', { logoPackId, mascotId, ...data });
  }
}
