import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pose, PoseStatus } from '../../../entities/pose.entity';
import { Mascot } from '../../../entities/mascot.entity';
import { ReplicateService } from '../../ai/replicate.service';
import { StorageService } from '../../storage/storage.service';
import { Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import { removeBackground } from '../../../common/utils/background-removal.util';

@Processor('pose-generation', {
  concurrency: 2,
})
export class PoseGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(PoseGenerationProcessor.name);

  constructor(
    @InjectRepository(Pose)
    private poseRepository: Repository<Pose>,
    @InjectRepository(Mascot)
    private mascotRepository: Repository<Mascot>,
    private replicateService: ReplicateService,
    private storageService: StorageService,
  ) {
    super();
  }

  /**
   * Poses use Nano Banana (Replicate): edit mascot image with pose prompt.
   * Modification applies only to the mascot, no background, 1080p for optimal render.
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { poseId, mascotId } = job.data;

    try {
      await this.poseRepository.update(poseId, { status: PoseStatus.GENERATING });

      // Use prompt from DB (source of truth) so retries / stale job data never reuse an old prompt
      const pose = await this.poseRepository.findOne({ where: { id: poseId } });
      if (!pose) throw new Error(`Pose ${poseId} not found`);
      const prompt = (pose.prompt ?? job.data.prompt ?? '').trim();
      this.logger.log(`[PoseGenerationProcessor] Starting pose ${poseId} (mascot ${mascotId}), prompt: "${prompt}"`);

      const mascot = await this.mascotRepository.findOne({ where: { id: mascotId } });
      if (!mascot) throw new Error(`Mascot ${mascotId} not found`);

      const refImageUrl = mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.squareIconUrl;
      if (!refImageUrl) {
        throw new Error('Mascot has no image (fullBody, avatar or squareIcon). Poses require a reference image.');
      }
      if (!this.replicateService.isAvailable()) {
        throw new Error('Pose generation requires Replicate. Set REPLICATE_API_TOKEN in your environment.');
      }

      // Prompt: mascot action (user choice), no background, high definition, 1k
      const posePromptText = `Mascot ${prompt || 'pose'}, no background, high definition, 1k.`;

      let imageBuffer: Buffer;
      if (this.replicateService.useNanoBananaForPoses()) {
        this.logger.log('[PoseGenerationProcessor] Using Replicate Nano Banana (1:1, 1k, PNG, then background removal)');
        imageBuffer = await this.replicateService.editImageNanoBanana(refImageUrl, posePromptText, {
          resolution: '1k',
          aspectRatio: '1:1',
        });
      } else {
        this.logger.log(`[PoseGenerationProcessor] Using Replicate pose model: ${this.replicateService.getPoseModelId()}`);
        const poseSeed = Math.floor(Math.random() * 1e9);
        const legacyPrompt = `Only change the pose or action to: ${prompt || 'pose'}. Same character, same style. No background, high definition.`;
        imageBuffer = await this.replicateService.generatePoseFromReference(refImageUrl, legacyPrompt, {
          negativePrompt: mascot.negativePrompt || undefined,
          seed: poseSeed,
        });
      }

      // Keep under ~1MB for rembg data URI (Replicate limit)
      if (imageBuffer.length > 900 * 1024) {
        const meta = await sharp(imageBuffer).metadata();
        const w = meta.width ?? 1024;
        const h = meta.height ?? 1024;
        const maxSide = 1024;
        if (w > maxSide || h > maxSide) {
          imageBuffer = await sharp(imageBuffer)
            .resize(maxSide, maxSide, { fit: 'inside', withoutEnlargement: true })
            .png({ compressionLevel: 9 })
            .toBuffer();
        }
      }

      // Real cutout: Replicate rembg-enhance (smoretalk/rembg-enhance, transparent background)
      this.logger.log('Removing background with Replicate rembg-enhance (cutout)...');
      try {
        imageBuffer = await this.replicateService.removeBackgroundReplicate(imageBuffer);
        this.logger.log('Background removal (rembg-enhance) completed');
      } catch (rembgErr: any) {
        this.logger.warn(
          `[PoseGenerationProcessor] rembg-enhance failed (${rembgErr?.message ?? rembgErr}), using local removal only`,
        );
      }
      // Cleanup: remove remaining gray/dark bg, halo, thin strips (aggressive + second pass for better detouring)
      imageBuffer = await removeBackground(imageBuffer, {
        aggressive: true,
        eraseSemiTransparentBorder: true,
        borderAlphaThreshold: 160,
        eraseWhiteOutline: true,
        secondPass: true,
      });

      // Same resize style as mascot avatar (512x512, contain, transparent)
      const transparentBackground = { r: 0, g: 0, b: 0, alpha: 0 };
      const poseImageBuffer = await sharp(imageBuffer)
        .ensureAlpha()
        .resize(512, 512, {
          fit: 'contain',
          background: transparentBackground,
          withoutEnlargement: true,
        })
        .png({ compressionLevel: 9, quality: 100, palette: false, adaptiveFiltering: true, force: true })
        .toBuffer();

      const timestamp = Date.now();
      const imageKey = `poses/${mascotId}/${poseId}-${timestamp}.png`;
      const imageUrl = await this.storageService.uploadImage(imageKey, poseImageBuffer);

      await this.poseRepository.update(poseId, { imageUrl, status: PoseStatus.COMPLETED });
      this.logger.log(`[PoseGenerationProcessor] Successfully generated pose ${poseId}`);
      return { success: true, poseId };
    } catch (error) {
      this.logger.error(`[PoseGenerationProcessor] Failed pose ${poseId}:`, error);
      await this.poseRepository.update(poseId, {
        status: PoseStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
