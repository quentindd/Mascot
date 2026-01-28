import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pose, PoseStatus } from '../../../entities/pose.entity';
import { Mascot } from '../../../entities/mascot.entity';
import { GeminiFlashService } from '../../ai/gemini-flash.service';
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
    private geminiFlashService: GeminiFlashService,
    private storageService: StorageService,
  ) {
    super();
  }

  /**
   * Same flow as Create (mascot): same generateImage call, same removeBackground, same resize.
   * Only change: mascotDetails = mascot.prompt + "Only change the pose or action: [prompt]".
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { poseId, mascotId, prompt } = job.data;

    this.logger.log(`[PoseGenerationProcessor] Starting pose ${poseId} (mascot ${mascotId}), prompt: "${prompt}"`);

    try {
      await this.poseRepository.update(poseId, { status: PoseStatus.GENERATING });

      const mascot = await this.mascotRepository.findOne({ where: { id: mascotId } });
      if (!mascot) throw new Error(`Mascot ${mascotId} not found`);

      // Same as Create: reuse mascot's prompt + add only the pose modification
      const mascotDetailsText = `${mascot.prompt}. Same character, same design. Only change the pose or action: ${prompt}`;

      let seed = mascot.seed;
      if (!seed && mascot.characterId) {
        seed = mascot.characterId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      } else if (!seed) {
        seed = mascotId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      }

      // Same generateImage call as Create (mascot-generation.processor)
      let imageBuffer = await this.geminiFlashService.generateImage({
        mascotDetails: mascotDetailsText,
        type: mascot.type || 'auto',
        style: mascot.style,
        personality: mascot.personality || 'friendly',
        bodyParts: mascot.accessories || [],
        color: mascot.brandColors?.primary || null,
        negativePrompt: mascot.negativePrompt || '',
        aspectRatio: '1:1',
        seed,
      });

      // Same background removal as Create
      this.logger.log('Removing background from generated pose image...');
      imageBuffer = await removeBackground(imageBuffer);
      this.logger.log('Background removal completed');

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
