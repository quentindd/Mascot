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

  /**
   * Remove background from image by making white/light pixels transparent
   * Uses Sharp's unflatten() method and aggressive edge-based background removal
   */
  private async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    try {
      this.logger.log('Removing background from image (aggressive mode)...');
      
      // First, ensure alpha channel exists
      let processed = sharp(imageBuffer).ensureAlpha();
      
      // Use unflatten() to make white pixels transparent (experimental but works well)
      // This makes all white pixel values fully transparent
      processed = processed.unflatten();
      
      // Get raw pixel data for aggressive processing
      const { data, info } = await processed
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = new Uint8ClampedArray(data);
      const width = info.width;
      const height = info.height;
      const channels = info.channels;
      
      // More aggressive thresholds
      const lightThreshold = 230; // Lower threshold (230-255 = light/white)
      const edgeSize = 20; // Larger edge area to process
      
      // Sample corners to detect background color
      const cornerSamples: number[] = [];
      const sampleSize = Math.min(15, Math.floor(width / 8), Math.floor(height / 8));
      
      for (let y = 0; y < sampleSize; y++) {
        for (let x = 0; x < sampleSize; x++) {
          // All four corners
          const corners = [
            (y * width + x) * channels, // top-left
            (y * width + (width - 1 - x)) * channels, // top-right
            ((height - 1 - y) * width + x) * channels, // bottom-left
            ((height - 1 - y) * width + (width - 1 - x)) * channels, // bottom-right
          ];
          
          corners.forEach(idx => {
            const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
            cornerSamples.push(brightness);
          });
        }
      }
      
      const avgCornerBrightness = cornerSamples.reduce((a, b) => a + b, 0) / cornerSamples.length;
      const isLikelyLightBackground = avgCornerBrightness > 200;
      
      // Process all pixels aggressively
      for (let i = 0; i < pixels.length; i += channels) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const alphaIdx = i + 3;
        
        // Calculate pixel position
        const pixelIndex = i / channels;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        
        // Check if pixel is on the edge (larger area)
        const isOnEdge = x < edgeSize || x > width - edgeSize || y < edgeSize || y > height - edgeSize;
        
        // Calculate brightness
        const brightness = (r + g + b) / 3;
        
        // Check if pixel is very light (white/light background)
        const isVeryLight = r > lightThreshold && g > lightThreshold && b > lightThreshold;
        
        // Check if pixel is similar to corner background (if background is light)
        const isSimilarToBackground = isLikelyLightBackground && Math.abs(brightness - avgCornerBrightness) < 30;
        
        // Aggressive removal: make transparent if:
        // 1. Very light AND on edge, OR
        // 2. Similar to background color AND on edge, OR
        // 3. Very light anywhere (not just edge) if background is light
        if ((isVeryLight && isOnEdge) || 
            (isSimilarToBackground && isOnEdge) ||
            (isVeryLight && isLikelyLightBackground)) {
          pixels[alphaIdx] = 0; // Fully transparent
        } else if (isVeryLight && !isOnEdge) {
          // For very light pixels in center, make semi-transparent
          pixels[alphaIdx] = Math.min(pixels[alphaIdx] || 255, 150);
        }
      }
      
      // Convert back to PNG with transparency
      const result = await sharp(Buffer.from(pixels), {
        raw: {
          width,
          height,
          channels: 4, // RGBA
        },
      })
        .png({ compressionLevel: 9, quality: 100, force: true })
        .toBuffer();
      
      this.logger.log('Background removal completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Failed to remove background, using original with alpha:', error);
      // Fallback: ensure alpha channel exists
      return await sharp(imageBuffer)
        .ensureAlpha()
        .png({ force: true })
        .toBuffer();
    }
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

      // Remove background automatically to ensure transparency
      this.logger.log('Removing background from generated image...');
      imageBuffer = await this.removeBackground(imageBuffer);
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
