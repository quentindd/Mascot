import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mascot, MascotStatus } from '../../../entities/mascot.entity';
import { GeminiFlashService } from '../../ai/gemini-flash.service';
import { StorageService } from '../../storage/storage.service';
import { CreditsService } from '../../credits/credits.service';
import { Logger } from '@nestjs/common';
import * as sharp from 'sharp';

@Processor('mascot-generation')
export class MascotGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(MascotGenerationProcessor.name);

  constructor(
    @InjectRepository(Mascot)
    private mascotRepository: Repository<Mascot>,
    private geminiFlashService: GeminiFlashService,
    private storageService: StorageService,
    private creditsService: CreditsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const {
      mascotId,
      prompt,
      mascotDetails, // Alias MascotAI
      style,
      type,
      personality,
      negativePrompt,
      accessories,
      bodyParts, // Alias MascotAI
      brandColors,
      color, // Simple color string MascotAI
      brandName, // Alias MascotAI
      name, // Original name
      appDescription, // MascotAI
      aspectRatio,
      advancedMode,
      variationIndex,
      batchId,
    } = job.data;

    this.logger.log(`Processing mascot generation: ${mascotId} (variation ${variationIndex || 1})`);

    try {
      // Update status to GENERATING
      await this.mascotRepository.update(mascotId, {
        status: MascotStatus.GENERATING,
      });

      // Check if Gemini Flash is available
      if (!this.geminiFlashService.isAvailable()) {
        this.logger.warn('Gemini Flash not available, falling back to placeholder');
        throw new Error('Gemini Flash service not configured. Please set GOOGLE_CLOUD_PROJECT_ID and credentials.');
      }

      // Prepare config exactly like MascotAI
      const mascotDetailsText = mascotDetails || prompt;
      const bodyPartsArray = bodyParts || accessories || [];
      const brandNameText = brandName || name;

      // Generate image with Gemini 2.5 Flash (exactly like MascotAI)
      const imageBuffer = await this.geminiFlashService.generateImage({
        mascotDetails: mascotDetailsText,
        type: type || 'auto',
        style: style,
        personality: personality || 'friendly',
        bodyParts: bodyPartsArray,
        color: color,
        brandName: brandNameText,
        appDescription: appDescription,
        negativePrompt: negativePrompt || '',
        aspectRatio: aspectRatio || '1:1',
        seed: Date.now() + (variationIndex || 0),
      });

      // Generate different sizes (full body, avatar, square icon)
      const fullBodyBuffer = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      const avatarBuffer = await sharp(imageBuffer)
        .resize(512, 512, { fit: 'cover', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      const squareIconBuffer = await sharp(imageBuffer)
        .resize(256, 256, { fit: 'cover', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      // Upload to S3/CDN
      const timestamp = Date.now();
      const baseKey = `mascots/${mascotId}`;

      let fullBodyUrl: string | null = null;
      let avatarUrl: string | null = null;
      let squareIconUrl: string | null = null;

      try {
        fullBodyUrl = await this.storageService.uploadImage(
          `${baseKey}/full-body-${timestamp}.png`,
          fullBodyBuffer,
        );

        avatarUrl = await this.storageService.uploadImage(
          `${baseKey}/avatar-${timestamp}.png`,
          avatarBuffer,
        );

        squareIconUrl = await this.storageService.uploadImage(
          `${baseKey}/square-icon-${timestamp}.png`,
          squareIconBuffer,
        );

        this.logger.log(`Successfully uploaded images for mascot ${mascotId}`);
      } catch (uploadError) {
        this.logger.error(`Failed to upload images for mascot ${mascotId}:`, uploadError);
        this.logger.error('Upload error:', uploadError instanceof Error ? uploadError.message : String(uploadError));
        // Continue anyway - images are generated, just not uploaded
        // The URLs will be null, but the generation succeeded
      }

      // Update mascot record
      await this.mascotRepository.update(mascotId, {
        status: MascotStatus.COMPLETED,
        fullBodyImageUrl: fullBodyUrl,
        avatarImageUrl: avatarUrl,
        squareIconUrl: squareIconUrl,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gemini-2.5-flash-image', // Exactement comme MascotAI
          style,
          type,
          personality,
          variationIndex,
          batchId,
          mascotDetails: mascotDetailsText,
          bodyParts: bodyPartsArray,
          color: color,
          brandName: brandNameText,
          appDescription: appDescription,
        } as Record<string, any>,
      });

      this.logger.log(`Successfully generated mascot ${mascotId}`);
      return { success: true, mascotId };
    } catch (error) {
      this.logger.error(`Failed to generate mascot ${mascotId}:`, error);

      // Update status to FAILED
      await this.mascotRepository.update(mascotId, {
        status: MascotStatus.FAILED,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          failedAt: new Date().toISOString(),
        } as Record<string, any>,
      });

      // TODO: Refund credits if needed
      // await this.creditsService.refundCredits(userId, 1);

      throw error;
    }
  }
}
