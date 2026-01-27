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

@Processor('pose-generation', {
  concurrency: 2, // Process up to 2 pose generation jobs in parallel
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
   * Remove background from image by making white/light pixels transparent
   */
  private async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    try {
      this.logger.log('Removing background from pose image...');
      
      let processed = sharp(imageBuffer).ensureAlpha();
      processed = processed.unflatten();
      
      const { data, info } = await processed
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = new Uint8ClampedArray(data);
      const width = info.width;
      const height = info.height;
      const channels = info.channels;
      
      const lightThreshold = 230;
      const edgeSize = 20;
      
      // Sample corners to detect background color
      const cornerSamples: number[] = [];
      const sampleSize = Math.min(15, Math.floor(width / 8), Math.floor(height / 8));
      
      for (let y = 0; y < sampleSize; y++) {
        for (let x = 0; x < sampleSize; x++) {
          const corners = [
            (y * width + x) * channels,
            (y * width + (width - 1 - x)) * channels,
            ((height - 1 - y) * width + x) * channels,
            ((height - 1 - y) * width + (width - 1 - x)) * channels,
          ];
          
          corners.forEach(idx => {
            const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
            cornerSamples.push(brightness);
          });
        }
      }
      
      const avgCornerBrightness = cornerSamples.reduce((a, b) => a + b, 0) / cornerSamples.length;
      const isLikelyLightBackground = avgCornerBrightness > 200;
      
      // Process all pixels
      for (let i = 0; i < pixels.length; i += channels) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const alphaIdx = i + 3;
        
        const pixelIndex = i / channels;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        
        const isOnEdge = x < edgeSize || x > width - edgeSize || y < edgeSize || y > height - edgeSize;
        const brightness = (r + g + b) / 3;
        const isVeryLight = r > lightThreshold && g > lightThreshold && b > lightThreshold;
        
        if (isOnEdge && (isVeryLight || (isLikelyLightBackground && brightness > 200))) {
          pixels[alphaIdx] = 0; // Make transparent
        }
      }
      
      return await sharp(Buffer.from(pixels), {
        raw: {
          width,
          height,
          channels: 4,
        },
      })
        .png({ compressionLevel: 9, quality: 100, palette: false, adaptiveFiltering: true })
        .toBuffer();
    } catch (error) {
      this.logger.error('Error removing background:', error);
      return imageBuffer; // Return original if background removal fails
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const {
      poseId,
      mascotId,
      prompt,
    } = job.data;

    this.logger.log(`[PoseGenerationProcessor] Starting processing for pose ${poseId} (mascot ${mascotId})`);
    this.logger.log(`[PoseGenerationProcessor] Job ID: ${job.id}, Attempt: ${job.attemptsMade + 1}/${job.opts.attempts || 1}`);
    this.logger.log(`[PoseGenerationProcessor] Prompt: "${prompt}"`);

    try {
      // Update status to generating
      await this.poseRepository.update(poseId, {
        status: PoseStatus.GENERATING,
      });

      // Get mascot details
      const mascot = await this.mascotRepository.findOne({ where: { id: mascotId } });
      if (!mascot) {
        throw new Error(`Mascot ${mascotId} not found`);
      }

      // Build prompt for Gemini Flash
      // Combine original mascot description with the pose/action prompt
      const mascotDetailsText = `${mascot.prompt}. ${prompt}`;
      
      this.logger.log(`[PoseGenerationProcessor] Calling Gemini Flash API with combined prompt...`);
      const generationStartTime = Date.now();
      
      let imageBuffer = await this.geminiFlashService.generateImage({
        mascotDetails: mascotDetailsText,
        type: mascot.type || 'auto',
        style: mascot.style,
        personality: mascot.personality || 'friendly',
        bodyParts: mascot.accessories || [],
        color: mascot.brandColors?.primary || null,
        negativePrompt: mascot.negativePrompt || '',
        aspectRatio: '1:1',
        seed: Date.now(),
      });
      
      const generationTime = Date.now() - generationStartTime;
      this.logger.log(`[PoseGenerationProcessor] Gemini Flash API completed in ${generationTime}ms`);

      // Remove background automatically
      this.logger.log('Removing background from generated pose image...');
      imageBuffer = await this.removeBackground(imageBuffer);
      this.logger.log('Background removal completed');

      // Resize to 512x512 (same as mascot avatar)
      const transparentBackground = { r: 0, g: 0, b: 0, alpha: 0 };
      
      const poseImageBuffer = await sharp(imageBuffer)
        .ensureAlpha()
        .resize(512, 512, { 
          fit: 'contain', 
          background: transparentBackground,
          withoutEnlargement: true 
        })
        .png({ 
          compressionLevel: 9, 
          quality: 100, 
          palette: false,
          adaptiveFiltering: true,
          force: true
        })
        .toBuffer();

      // Upload to storage
      const timestamp = Date.now();
      const imageKey = `poses/${mascotId}/${poseId}-${timestamp}.png`;
      
      const imageUrl = await this.storageService.uploadImage(
        imageKey,
        poseImageBuffer,
      );

      this.logger.log(`Successfully uploaded pose image: ${imageUrl}`);

      // Update pose with image URL and mark as completed
      await this.poseRepository.update(poseId, {
        imageUrl,
        status: PoseStatus.COMPLETED,
      });

      this.logger.log(`[PoseGenerationProcessor] Successfully generated pose ${poseId}`);
      return { success: true, poseId };
    } catch (error) {
      this.logger.error(`[PoseGenerationProcessor] Failed to generate pose ${poseId}:`, error);
      this.logger.error(`[PoseGenerationProcessor] Error details:`, error instanceof Error ? error.message : String(error));
      this.logger.error(`[PoseGenerationProcessor] Error stack:`, error instanceof Error ? error.stack : 'No stack');

      // Update pose status to failed
      await this.poseRepository.update(poseId, {
        status: PoseStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}
