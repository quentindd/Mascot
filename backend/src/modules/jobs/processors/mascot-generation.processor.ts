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

  /**
   * Remove background from image by making white/light pixels transparent
   * Uses edge detection to identify background pixels
   */
  private async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      // Get raw pixel data
      const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = new Uint8ClampedArray(data);
      const width = info.width;
      const height = info.height;
      const channels = info.channels;

      // Process pixels to remove background
      // Strategy: Make pixels transparent if they are:
      // 1. White or very light (RGB > 240)
      // 2. Or similar to corner pixels (likely background)
      const cornerSamples: number[][] = [];
      const sampleSize = Math.min(10, Math.floor(width / 10), Math.floor(height / 10));
      
      // Sample corners to detect background color
      for (let y = 0; y < sampleSize; y++) {
        for (let x = 0; x < sampleSize; x++) {
          // Top-left corner
          const idx1 = (y * width + x) * channels;
          cornerSamples.push([pixels[idx1], pixels[idx1 + 1], pixels[idx1 + 2]]);
          
          // Top-right corner
          const idx2 = (y * width + (width - 1 - x)) * channels;
          cornerSamples.push([pixels[idx2], pixels[idx2 + 1], pixels[idx2 + 2]]);
          
          // Bottom-left corner
          const idx3 = ((height - 1 - y) * width + x) * channels;
          cornerSamples.push([pixels[idx3], pixels[idx3 + 1], pixels[idx3 + 2]]);
          
          // Bottom-right corner
          const idx4 = ((height - 1 - y) * width + (width - 1 - x)) * channels;
          cornerSamples.push([pixels[idx4], pixels[idx4 + 1], pixels[idx4 + 2]]);
        }
      }

      // Calculate average background color from corners
      const avgBg = cornerSamples.reduce(
        (acc, pixel) => [acc[0] + pixel[0], acc[1] + pixel[1], acc[2] + pixel[2]],
        [0, 0, 0]
      ).map(sum => sum / cornerSamples.length);

      // Threshold for background detection (similarity to corner colors or very light)
      const threshold = 25; // Color difference threshold (more conservative)
      const lightThreshold = 245; // RGB value for "very light" pixels (more conservative - only very white)
      
      // Only remove background if corners are actually light/uniform (likely background)
      const avgBgBrightness = (avgBg[0] + avgBg[1] + avgBg[2]) / 3;
      const isLikelyBackground = avgBgBrightness > 200; // Only if corners are light

      // Process all pixels
      for (let i = 0; i < pixels.length; i += channels) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const alphaIdx = i + 3;
        
        // Calculate pixel position
        const pixelIndex = i / channels;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        
        // Check if pixel is on the edge (more likely to be background)
        const isOnEdge = x < 5 || x > width - 5 || y < 5 || y > height - 5;

        // Check if pixel is very light (white/light background)
        const isLight = r > lightThreshold && g > lightThreshold && b > lightThreshold;
        
        // Check if pixel is similar to corner background color
        const colorDiff = Math.abs(r - avgBg[0]) + Math.abs(g - avgBg[1]) + Math.abs(b - avgBg[2]);
        const isBackground = colorDiff < threshold;

        // Only remove if:
        // 1. It's very light (white) AND on edge, OR
        // 2. It's similar to background color AND (on edge OR background is likely uniform)
        if ((isLight && isOnEdge) || (isBackground && isLikelyBackground && isOnEdge)) {
          pixels[alphaIdx] = 0; // Fully transparent
        } else if (isLight && !isOnEdge) {
          // For very light pixels in center, make semi-transparent (might be highlights)
          pixels[alphaIdx] = Math.min(pixels[alphaIdx] || 255, 200);
        }
      }

      // Convert back to PNG with transparency
      return await sharp(Buffer.from(pixels), {
        raw: {
          width,
          height,
          channels: 4, // RGBA
        },
      })
        .png({ compressionLevel: 9, quality: 100, force: true })
        .toBuffer();
    } catch (error) {
      this.logger.warn('Failed to remove background, using original image:', error);
      // If background removal fails, return original with ensureAlpha
      return await sharp(imageBuffer).ensureAlpha().png().toBuffer();
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
      
      // Don't pass brandName to avoid text appearing on image
      // If user wants brand name, they should include it in their prompt
      // brandName is only used for database storage, not for image generation

      // Generate image with Gemini 2.5 Flash (exactly like MascotAI)
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
