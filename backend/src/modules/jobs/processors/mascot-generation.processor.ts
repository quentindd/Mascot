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
import { removeBackground } from '../../../common/utils/background-removal.util';

@Processor('mascot-generation', {
  concurrency: 3, // Process up to 3 jobs in parallel (one per variation)
})
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

    this.logger.log(`[MascotGenerationProcessor] Starting processing for mascot ${mascotId} (variation ${variationIndex || 1} of batch ${batchId})`);
    this.logger.log(`[MascotGenerationProcessor] Job ID: ${job.id}, Attempt: ${job.attemptsMade + 1}/${job.opts.attempts || 1}`);

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
      let mascotDetailsText = mascotDetails || prompt;
      const bodyPartsArray = bodyParts || accessories || [];
      
      // Remove brand name from prompt if it appears (to prevent text on image)
      // Only keep it if user explicitly wants it (they can add it back in their prompt)
      if (brandName || name) {
        const nameToRemove = brandName || name;
        // Remove the name if it appears in the prompt (case insensitive)
        const nameRegex = new RegExp(`\\b${nameToRemove}\\b`, 'gi');
        mascotDetailsText = mascotDetailsText.replace(nameRegex, '').trim();
        // Clean up any double spaces or commas
        mascotDetailsText = mascotDetailsText.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();
      }
      
      // Don't pass brandName to avoid text appearing on image
      // If user wants brand name, they should include it in their prompt explicitly
      // brandName is only used for database storage, not for image generation

      // Generate image with Gemini 2.5 Flash (exactly like MascotAI)
      this.logger.log(`[MascotGenerationProcessor] Calling Gemini Flash API for variation ${variationIndex || 1}...`);
      const generationStartTime = Date.now();
      let imageBuffer = await this.geminiFlashService.generateImage({
        mascotDetails: mascotDetailsText,
        type: type || 'auto',
        style: style,
        personality: personality || 'friendly',
        bodyParts: bodyPartsArray,
        color: color,
        // brandName removed - we don't want text on images unless user explicitly asks
        appDescription: appDescription,
        negativePrompt: negativePrompt || '',
        aspectRatio: aspectRatio || '1:1',
        seed: Date.now() + (variationIndex || 0),
      });
      const generationTime = Date.now() - generationStartTime;
      this.logger.log(`[MascotGenerationProcessor] Gemini Flash API completed for variation ${variationIndex || 1} in ${generationTime}ms`);

      // Remove background + white outline (same util as Poses, with outline erosion for create)
      this.logger.log('Removing background from generated image...');
      imageBuffer = await removeBackground(imageBuffer, {
        aggressive: true,
        eraseSemiTransparentBorder: true,
        borderAlphaThreshold: 160,
        eraseWhiteOutline: true,
      });
      this.logger.log('Background removal completed');

      // Generate different sizes (full body, avatar, square icon)
      // Ensure PNG with alpha channel for transparent background
      // Use removeAlpha: false to preserve transparency, and ensureAlpha to add it if missing
      const transparentBackground = { r: 0, g: 0, b: 0, alpha: 0 };
      
      const fullBodyBuffer = await sharp(imageBuffer)
        .ensureAlpha() // Ensure alpha channel exists
        .resize(1024, 1024, { 
          fit: 'contain', 
          background: transparentBackground,
          withoutEnlargement: true 
        })
        .png({ 
          compressionLevel: 9, 
          quality: 100, 
          palette: false, // Don't use palette mode to preserve full alpha channel
          adaptiveFiltering: true,
          force: true // Force PNG output
        })
        .toBuffer();

      const avatarBuffer = await sharp(imageBuffer)
        .ensureAlpha() // Ensure alpha channel exists
        .resize(512, 512, { 
          fit: 'cover', 
          background: transparentBackground,
          withoutEnlargement: true 
        })
        .png({ 
          compressionLevel: 9, 
          quality: 100, 
          palette: false, // Don't use palette mode to preserve full alpha channel
          adaptiveFiltering: true,
          force: true // Force PNG output
        })
        .toBuffer();

      const squareIconBuffer = await sharp(imageBuffer)
        .ensureAlpha() // Ensure alpha channel exists
        .resize(256, 256, { 
          fit: 'cover', 
          background: transparentBackground,
          withoutEnlargement: true 
        })
        .png({ 
          compressionLevel: 9, 
          quality: 100, 
          palette: false, // Don't use palette mode to preserve full alpha channel
          adaptiveFiltering: true,
          force: true // Force PNG output
        })
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
          brandName: brandName || name, // Store for reference, but not used in generation
          appDescription: appDescription,
        } as Record<string, any>,
      });

      this.logger.log(`[MascotGenerationProcessor] Successfully generated mascot ${mascotId} (variation ${variationIndex || 1})`);
      return { success: true, mascotId };
    } catch (error) {
      this.logger.error(`[MascotGenerationProcessor] Failed to generate mascot ${mascotId} (variation ${variationIndex || 1}):`, error);
      this.logger.error(`[MascotGenerationProcessor] Error details:`, error instanceof Error ? error.message : String(error));
      this.logger.error(`[MascotGenerationProcessor] Error stack:`, error instanceof Error ? error.stack : 'No stack');

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
