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
    const { poseId, mascotId, prompt } = job.data;

    this.logger.log(`[PoseGenerationProcessor] Starting pose ${poseId} (mascot ${mascotId}), prompt: "${prompt}"`);

    try {
      await this.poseRepository.update(poseId, { status: PoseStatus.GENERATING });

      const mascot = await this.mascotRepository.findOne({ where: { id: mascotId } });
      if (!mascot) throw new Error(`Mascot ${mascotId} not found`);

      const refImageUrl = mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.squareIconUrl;
      if (!refImageUrl) {
        throw new Error('Mascot has no image (fullBody, avatar or squareIcon). Poses require a reference image.');
      }
      if (!this.replicateService.isAvailable()) {
        throw new Error('Pose generation requires Replicate. Set REPLICATE_API_TOKEN in your environment.');
      }

      const styleHint =
        mascot.style === 'kawaii'
          ? 'kawaii cartoon'
          : mascot.style === '3d' || mascot.style === '3d_pixar'
            ? '3D character'
            : 'cartoon illustration';
      const hasWings = mascot.accessories?.some((a) => String(a).toLowerCase().includes('wing')) ?? false;
      const isAnimalOrCreature =
        mascot.type === 'animal' || mascot.type === 'creature' || mascot.type === 'auto';
      const noHandsRule =
        hasWings || isAnimalOrCreature
          ? 'FORBIDDEN: hands, fingers, human arms. The reference has NO human hands. Output MUST have NO hands, NO arms, NO fingers. Only wings/paws/feet as in the reference. Do not add any limb that is not in the reference.'
          : 'Copy EXACTLY the body parts from the reference. Do not add hands or arms if the reference does not have them.';
      const posePromptText =
        `CRITICAL: Do not denature the character. ${noHandsRule} The output must have EXACTLY the same body parts as the reference—nothing more. ` +
        `Keep the EXACT same character: same ${styleHint} style, same colors, same design, same proportions. Same limbs only (wings stay wings, paws stay paws, NO hands). ` +
        `Only change the pose or action to: ${prompt}. Same stylized mascot as the reference. ` +
        `No glow, no aura, no halo, no outline. Flat colors only. Completely transparent background only—no dark background, no gradient.`;

      let imageBuffer: Buffer;
      if (this.replicateService.useNanoBananaForPoses()) {
        this.logger.log('[PoseGenerationProcessor] Using Replicate Nano Banana (mascot-only edit, no background, 1080p)');
        imageBuffer = await this.replicateService.editImageNanoBanana(refImageUrl, posePromptText, {
          resolution: '1080p',
        });
      } else {
        this.logger.log(`[PoseGenerationProcessor] Using Replicate pose model: ${this.replicateService.getPoseModelId()}`);
        const poseSeed = Math.floor(Math.random() * 1e9);
        imageBuffer = await this.replicateService.generatePoseFromReference(refImageUrl, posePromptText, {
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

      // Real cutout: Replicate rembg (transparent background, no gray)
      this.logger.log('Removing background with Replicate rembg (cutout)...');
      try {
        imageBuffer = await this.replicateService.removeBackgroundReplicate(imageBuffer);
        this.logger.log('Background removal (rembg) completed');
        // Cleanup: remove any remaining gray/dark bg (Replicate often leaves some) + halo; keep aggressive for poses so bg is fully removed
        imageBuffer = await removeBackground(imageBuffer, {
          aggressive: true,
          eraseSemiTransparentBorder: true,
          borderAlphaThreshold: 100,
          eraseWhiteOutline: true,
        });
      } catch (rembgErr) {
        this.logger.warn('[PoseGenerationProcessor] rembg failed, using local removal:', rembgErr);
        imageBuffer = await removeBackground(imageBuffer, {
          aggressive: true,
          eraseSemiTransparentBorder: true,
          borderAlphaThreshold: 100,
          eraseWhiteOutline: true,
        });
      }

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
