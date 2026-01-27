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
    @InjectQueue('pose-generation')
    private poseQueue: Queue,
  ) {}

  async enqueueMascotGeneration(mascotId: string, data: any) {
    try {
      await this.mascotQueue.add('generate', { mascotId, ...data });
      console.log(`[JobsService] Successfully enqueued mascot generation for ${mascotId}`);
    } catch (error) {
      console.error(`[JobsService] Failed to enqueue mascot generation for ${mascotId}:`, error);
      console.error(`[JobsService] Error type:`, error?.constructor?.name);
      console.error(`[JobsService] Error message:`, error instanceof Error ? error.message : String(error));
      console.error(`[JobsService] Error stack:`, error instanceof Error ? error.stack : 'No stack');
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

  async enqueuePoseGeneration(poseId: string, mascotId: string, data: any) {
    await this.poseQueue.add('generate', { poseId, mascotId, ...data });
  }
}
