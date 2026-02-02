import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mascot, MascotStatus } from '../../../entities/mascot.entity';
import { GeminiFlashService } from '../../ai/gemini-flash.service';
import { ReplicateService } from '../../ai/replicate.service';
import { StorageService } from '../../storage/storage.service';
import { CreditsService } from '../../credits/credits.service';
import { Logger } from '@nestjs/common';
import * as sharp from 'sharp';

@Processor('mascot-generation', {
  concurrency: 1, // One at a time to avoid Gemini 429 and Replicate rate limit (6/min when <$5)
})
export class MascotGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(MascotGenerationProcessor.name);

  constructor(
    @InjectRepository(Mascot)
    private mascotRepository: Repository<Mascot>,
    private geminiFlashService: GeminiFlashService,
    private replicateService: ReplicateService,
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

      // Remove background: only rembg-enhance. No image is saved or shown until rembg succeeds.
      this.logger.log('Removing background (rembg-enhance only)...');
      let imageBufferAfterRembg: Buffer | null = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          imageBufferAfterRembg = await this.replicateService.removeBackgroundReplicate(imageBuffer);
          this.logger.log(`[MascotGenerationProcessor] rembg-enhance completed (attempt ${attempt})`);
          break;
        } catch (rembgErr) {
          const msg = rembgErr instanceof Error ? rembgErr.message : String(rembgErr);
          this.logger.warn(`[MascotGenerationProcessor] rembg-enhance attempt ${attempt} failed:`, msg);
          if (attempt === 2) {
            throw new Error(
              'Background removal (rembg-enhance) failed. No image will be shown. Please try again.',
            );
          }
          // When throttled/rate limit, wait longer before retry (Replicate: "resets in ~6s")
          const isThrottle = /throttled|rate limit|reset/i.test(msg);
          const delayMs = isThrottle ? 10000 : 2000;
          this.logger.log(`[MascotGenerationProcessor] Retrying rembg in ${delayMs / 1000}s...`);
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
      if (!imageBufferAfterRembg) {
        throw new Error('Background removal (rembg-enhance) failed. No image will be shown.');
      }
      imageBuffer = imageBufferAfterRembg;

      // Single size: full body 1024x1024 (plugin only shows this; pose/animation use same URL as fallback)
      const transparentBackground = { r: 0, g: 0, b: 0, alpha: 0 };
      const fullBodyBuffer = await sharp(imageBuffer)
        .ensureAlpha()
        .resize(1024, 1024, {
          fit: 'contain',
          background: transparentBackground,
          withoutEnlargement: true,
        })
        .png({
          compressionLevel: 9,
          quality: 100,
          palette: false,
          adaptiveFiltering: true,
          force: true,
        })
        .toBuffer();

      const timestamp = Date.now();
      const baseKey = `mascots/${mascotId}`;
      let fullBodyUrl: string | null = null;

      try {
        fullBodyUrl = await this.storageService.uploadImage(
          `${baseKey}/full-body-${timestamp}.png`,
          fullBodyBuffer,
        );
        this.logger.log(`Successfully uploaded full-body image for mascot ${mascotId}`);
      } catch (uploadError) {
        this.logger.error(`Failed to upload image for mascot ${mascotId}:`, uploadError);
        this.logger.error('Upload error:', uploadError instanceof Error ? uploadError.message : String(uploadError));
        throw uploadError;
      }

      // Same URL for avatar/squareIcon so pose & animation backends keep working
      const avatarUrl = fullBodyUrl;
      const squareIconUrl = fullBodyUrl;

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
