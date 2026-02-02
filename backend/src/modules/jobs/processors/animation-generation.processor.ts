import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnimationJob, AnimationStatus, AnimationAction } from '../../../entities/animation-job.entity';
import { Mascot } from '../../../entities/mascot.entity';
import { ReplicateService } from '../../ai/replicate.service';
import { StorageService } from '../../storage/storage.service';
import { Logger } from '@nestjs/common';
import * as sharp from 'sharp';
// @ts-ignore - fluent-ffmpeg types may not be available
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { removeBackground } from '../../../common/utils/background-removal.util';

@Processor('animation-generation')
export class AnimationGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(AnimationGenerationProcessor.name);

  constructor(
    @InjectRepository(AnimationJob)
    private animationRepository: Repository<AnimationJob>,
    @InjectRepository(Mascot)
    private mascotRepository: Repository<Mascot>,
    private replicateService: ReplicateService,
    private storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { animationId, mascotId, action, customAction } = job.data;
    const resolution = 1080; // Fixed 1080p 16:9 for all providers

    this.logger.log(`[AnimationGenerationProcessor] Starting animation generation: ${animationId} for mascot ${mascotId}, action: ${action}`);

    try {
      // Update status to GENERATING
      await this.animationRepository.update(animationId, {
        status: AnimationStatus.GENERATING,
      });

      // Get mascot details
      const mascot = await this.mascotRepository.findOne({ where: { id: mascotId } });
      if (!mascot) {
        throw new Error(`Mascot ${mascotId} not found`);
      }

      if (!mascot.fullBodyImageUrl && !mascot.avatarImageUrl) {
        throw new Error(`Mascot ${mascotId} has no image`);
      }

      // Get mascot image for reference
      const mascotImageUrl = mascot.fullBodyImageUrl || mascot.avatarImageUrl;
      
      const timestamp = Date.now();
      const fps = 12;
      const frameCount = 12;
      let durationMs = 4000; // Veo = 4s

      let webmVideoUrl: string | null = null;
      let movVideoUrl: string | null = null;
      let spriteSheetUrl: string | null = null;
      let lottieUrl: string | null = null;
      let frameUrls: string[] = [];

      if (!this.replicateService.isAvailable()) {
        throw new Error(
          'Animation requires Replicate (Veo). Set REPLICATE_API_TOKEN in your environment.',
        );
      }

      this.logger.log(`[AnimationGenerationProcessor] Using Replicate Veo 3.1 Fast (only provider)...`);
      const animationPrompt = this.getAnimationPrompt(action, customAction, mascot) + ' seamless infinite loop';
      const { buffer: videoBuffer, predictionUrl: replicatePredictionUrl } =
        await this.replicateService.generateVideoVeo({
          imageUrl: mascotImageUrl,
          prompt: animationPrompt,
          duration: 4,
          resolution: '1080p',
          aspectRatio: '16:9',
          generateAudio: false,
        });
      if (replicatePredictionUrl) {
        this.logger.log(`[AnimationGenerationProcessor] Replicate run: ${replicatePredictionUrl}`);
      }
      this.logger.log(`[AnimationGenerationProcessor] Veo video generated: ${videoBuffer.length} bytes`);

      const ext = 'mp4';
      const movKey = `animations/${animationId}/animation-${timestamp}.${ext}`;
      movVideoUrl = await this.storageService.uploadVideo(movKey, videoBuffer, ext);
      this.logger.log(`[AnimationGenerationProcessor] Primary video uploaded: ${movVideoUrl}`);

      // Extract frames, remove background frame-by-frame, then build sprite/Lottie/WebM with transparency
      try {
        const rawFrames = await this.extractFramesFromVideo(videoBuffer, frameCount);
        if (rawFrames.length > 0) {
          this.logger.log(`[AnimationGenerationProcessor] Removing background from ${rawFrames.length} frames...`);
          const framesWithNoBg = await Promise.all(
            rawFrames.map((frame) =>
              removeBackground(frame, {
                aggressive: true,
                eraseSemiTransparentBorder: true,
                borderAlphaThreshold: 160,
                eraseWhiteOutline: true,
                secondPass: true,
              }),
            ),
          );
          this.logger.log(`[AnimationGenerationProcessor] Background removed from all frames`);

          spriteSheetUrl = await this.generateSpriteSheetFromFrames(framesWithNoBg, resolution, animationId, timestamp);
          for (let i = 0; i < framesWithNoBg.length; i++) {
            const frameKey = `animations/${animationId}/frame-${i + 1}-${timestamp}.png`;
            frameUrls.push(await this.storageService.uploadImage(frameKey, framesWithNoBg[i]));
          }
          const lottieJson = this.generateLottieJson(frameUrls, resolution, framesWithNoBg.length);
          const lottieKey = `animations/${animationId}/animation-${timestamp}.json`;
          lottieUrl = await this.storageService.uploadFile(
            lottieKey,
            Buffer.from(JSON.stringify(lottieJson, null, 2), 'utf-8'),
            'application/json',
          );

          try {
            webmVideoUrl = await this.generateWebMVideo(
              framesWithNoBg,
              resolution,
              framesWithNoBg.length,
              animationId,
              timestamp,
            );
            this.logger.log(`[AnimationGenerationProcessor] WebM with alpha: ${webmVideoUrl}`);
          } catch (webmError) {
            this.logger.warn(`[AnimationGenerationProcessor] WebM with alpha failed (non-critical):`, webmError);
          }
        }
      } catch (frameError) {
        this.logger.warn(`[AnimationGenerationProcessor] Frame extraction/background removal failed (non-critical):`, frameError);
      }

      // Fallback WebM from raw MP4 if we have no transparent frames
      if (!webmVideoUrl) {
        try {
          webmVideoUrl = await this.convertMP4ToWebM(videoBuffer, animationId, timestamp);
          this.logger.log(`[AnimationGenerationProcessor] WebM (no alpha) fallback: ${webmVideoUrl}`);
        } catch (convertError) {
          this.logger.warn(`[AnimationGenerationProcessor] WebM conversion failed (non-critical):`, convertError);
        }
      }

      // Fallback: ensure at least one frame URL for Figma (avoids "Image is too large" when sprite sheet is huge)
      if (frameUrls.length === 0) {
        try {
          const firstFrames = await this.extractFramesFromVideo(videoBuffer, 1);
          if (firstFrames.length > 0) {
            const firstWithNoBg = await removeBackground(firstFrames[0], {
              aggressive: true,
              eraseSemiTransparentBorder: true,
              secondPass: true,
            });
            const firstFrameKey = `animations/${animationId}/frame-1-${timestamp}.png`;
            frameUrls.push(await this.storageService.uploadImage(firstFrameKey, firstWithNoBg));
            this.logger.log(`[AnimationGenerationProcessor] Uploaded fallback first frame for Figma`);
          }
        } catch (firstFrameError) {
          this.logger.warn(`[AnimationGenerationProcessor] Fallback first-frame extraction failed:`, firstFrameError);
        }
      }

      // Update animation job
      await this.animationRepository.update(animationId, {
        status: AnimationStatus.COMPLETED,
        spriteSheetUrl,
        lottieUrl,
        webmVideoUrl,
        movVideoUrl,
        frameCount,
        durationMs,
        metadata: {
          generatedAt: new Date().toISOString(),
          action,
          customAction,
          resolution,
          fps,
          model: 'google/veo-3.1-fast',
          frameUrls,
          replicatePredictionUrl, // Link to view run in your Replicate dashboard (same token = same account)
          // Veo 3.1 Fast ~0.4¢/video; credit pricing in app TBD
        } as Record<string, any>,
      });

      this.logger.log(`[AnimationGenerationProcessor] Successfully completed animation ${animationId}`);
      return { success: true, animationId, spriteSheetUrl };
    } catch (error) {
      this.logger.error(`[AnimationGenerationProcessor] Failed to generate animation ${animationId}:`, error);
      this.logger.error(`[AnimationGenerationProcessor] Error details:`, error instanceof Error ? error.message : String(error));

      // Update status to FAILED
      await this.animationRepository.update(animationId, {
        status: AnimationStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : String(error),
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          failedAt: new Date().toISOString(),
        } as Record<string, any>,
      });

      throw error;
    }
  }

  /**
   * Legacy: frame-by-frame generation (Gemini). Not used; animation uses Replicate Veo 3.1 Fast only.
   */
  private async generateAnimationFrames(
    _mascot: Mascot,
    _action: AnimationAction,
    _customAction: string | null,
    _resolution: number,
    _frameCount: number,
  ): Promise<Buffer[]> {
    throw new Error(
      'Animation uses Replicate Veo 3.1 Fast only (image-to-video). This legacy path is disabled.',
    );
  }

  /**
   * Get pose prompts for each frame based on action
   */
  private getActionPrompts(action: AnimationAction, customAction: string | null, frameCount: number): string[] {
    const prompts: string[] = [];

    if (action === AnimationAction.CUSTOM && customAction) {
      // For custom actions, create a simple animation cycle
      for (let i = 0; i < frameCount; i++) {
        const progress = i / frameCount;
        prompts.push(`${customAction}, animation frame ${i + 1}, progress ${Math.round(progress * 100)}%`);
      }
      return prompts;
    }

    // Standard action prompts
    switch (action) {
      case AnimationAction.WAVE:
        for (let i = 0; i < frameCount; i++) {
          const progress = i / frameCount;
          const angle = Math.sin(progress * Math.PI * 2) * 30; // Wave arm up and down
          prompts.push(`waving hand, arm raised at ${Math.round(angle)} degrees, friendly gesture, animation frame ${i + 1}`);
        }
        break;

      case AnimationAction.CELEBRATE:
        for (let i = 0; i < frameCount; i++) {
          const progress = i / frameCount;
          const jumpHeight = Math.sin(progress * Math.PI * 2) * 0.3;
          prompts.push(`celebrating, jumping with arms raised, joyful expression, animation frame ${i + 1}, jump height ${Math.round(jumpHeight * 100)}%`);
        }
        break;

      case AnimationAction.THINK:
        for (let i = 0; i < frameCount; i++) {
          const progress = i / frameCount;
          const handPosition = progress < 0.5 ? 'hand on chin' : 'hand near head';
          prompts.push(`thinking pose, ${handPosition}, contemplative expression, animation frame ${i + 1}`);
        }
        break;

      case AnimationAction.SLEEP:
        for (let i = 0; i < frameCount; i++) {
          const progress = i / frameCount;
          const eyeState = progress < 0.3 ? 'eyes closed' : progress < 0.7 ? 'eyes half closed' : 'eyes closed';
          prompts.push(`sleeping pose, ${eyeState}, peaceful expression, animation frame ${i + 1}`);
        }
        break;

      case AnimationAction.SAD:
        for (let i = 0; i < frameCount; i++) {
          prompts.push(`sad expression, downcast eyes, melancholic pose, animation frame ${i + 1}`);
        }
        break;

      case AnimationAction.EXERCISE:
        for (let i = 0; i < frameCount; i++) {
          const progress = i / frameCount;
          const exerciseType = i % 3 === 0 ? 'arms up' : i % 3 === 1 ? 'arms to sides' : 'arms down';
          prompts.push(`exercising, ${exerciseType}, active pose, energetic expression, animation frame ${i + 1}`);
        }
        break;

      case AnimationAction.BACKFLIP:
        for (let i = 0; i < frameCount; i++) {
          const progress = i / frameCount;
          const rotation = progress * 360;
          prompts.push(`doing a backflip, rotating ${Math.round(rotation)} degrees, dynamic pose, animation frame ${i + 1}`);
        }
        break;

      case AnimationAction.DANCE:
        for (let i = 0; i < frameCount; i++) {
          const progress = i / frameCount;
          const danceMove = i % 4 === 0 ? 'arms up' : i % 4 === 1 ? 'arms to right' : i % 4 === 2 ? 'arms down' : 'arms to left';
          prompts.push(`dancing, ${danceMove}, joyful expression, animation frame ${i + 1}`);
        }
        break;

      case AnimationAction.JUMP:
        for (let i = 0; i < frameCount; i++) {
          const progress = i / frameCount;
          const jumpHeight = Math.sin(progress * Math.PI) * 0.5;
          prompts.push(`jumping, jump height ${Math.round(jumpHeight * 100)}%, dynamic pose, animation frame ${i + 1}`);
        }
        break;

      case AnimationAction.WALK:
        for (let i = 0; i < frameCount; i++) {
          const progress = i / frameCount;
          const stepPhase = (i % 4) < 2 ? 'left foot forward' : 'right foot forward';
          prompts.push(`walking, ${stepPhase}, walking animation, animation frame ${i + 1}`);
        }
        break;

      case AnimationAction.RUN:
        for (let i = 0; i < frameCount; i++) {
          const progress = i / frameCount;
          const stepPhase = (i % 3) === 0 ? 'left leg forward' : (i % 3) === 1 ? 'both legs mid-air' : 'right leg forward';
          prompts.push(`running, ${stepPhase}, fast movement, animation frame ${i + 1}`);
        }
        break;

      case AnimationAction.IDLE:
      default:
        // Idle animation - subtle breathing/movement
        for (let i = 0; i < frameCount; i++) {
          const progress = i / frameCount;
          const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.05; // Subtle breathing
          prompts.push(`idle pose, standing still, subtle breathing, scale ${scale.toFixed(2)}, animation frame ${i + 1}`);
        }
        break;
    }

    return prompts;
  }

  /**
   * Assemble frames into a horizontal sprite sheet
   */
  private async assembleSpriteSheet(frames: Buffer[], frameSize: number, frameCount: number): Promise<Buffer> {
    if (frames.length === 0) {
      throw new Error('No frames to assemble');
    }

    const actualFrameCount = frames.length;
    const spriteSheetWidth = frameSize * actualFrameCount;
    const spriteSheetHeight = frameSize;

    this.logger.log(`[AnimationGenerationProcessor] Assembling sprite sheet: ${spriteSheetWidth}x${spriteSheetHeight} with ${actualFrameCount} frames`);

    // Create sprite sheet canvas
    const spriteSheet = sharp({
      create: {
        width: spriteSheetWidth,
        height: spriteSheetHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    // Composite all frames horizontally
    const composites = frames.map((frame, index) => ({
      input: frame,
      left: index * frameSize,
      top: 0,
    }));

    const result = await spriteSheet
      .composite(composites)
      .png({ compressionLevel: 9, quality: 100, force: true })
      .toBuffer();

    this.logger.log(`[AnimationGenerationProcessor] Sprite sheet assembled: ${result.length} bytes`);
    return result;
  }

  /**
   * Generate Lottie JSON format from frame URLs
   * Lottie is the best format for app developers (iOS, Android, React Native, Web)
   * 
   * Format: Image sequence using stacked layers with time offsets
   * Each frame is a separate layer that appears at its specific time
   */
  private generateLottieJson(frameUrls: string[], frameSize: number, frameCount: number): any {
    const fps = 12; // Original animation fps
    const lottieFps = 60; // Lottie standard fps
    const framesPerImage = lottieFps / fps; // 5 frames per image at 60fps
    
    const totalFrames = frameCount * framesPerImage; // Total frames at 60fps

    // Create assets array with image references
    const assets = frameUrls.map((url, index) => ({
      id: `img_${index}`,
      w: frameSize,
      h: frameSize,
      u: '', // Base URL (empty, images are absolute URLs)
      p: url, // Image path/URL (absolute URL)
      e: 0, // Embedded (0 = external URL, 1 = base64)
    }));

    // Create one layer per frame with sequential time offsets
    // Each layer shows for exactly framesPerImage frames, then the next layer appears
    const layers = frameUrls.map((url, index) => {
      const startFrame = index * framesPerImage;
      const endFrame = (index + 1) * framesPerImage;
      
      return {
        ddd: 0,
        ind: index + 1, // Layer index (must be unique)
        ty: 2, // Layer type: Image (2)
        nm: `Frame ${index + 1}`, // Layer name
        refId: `img_${index}`, // Reference to asset
        sr: 1, // Stretch
        ks: {
          // Transform properties
          a: { a: 0, k: [0, 0, 0] }, // Anchor point (top-left)
          p: { a: 0, k: [frameSize / 2, frameSize / 2, 0] }, // Position (center)
          r: { a: 0, k: 0 }, // Rotation
          s: { a: 0, k: [100, 100, 100] }, // Scale (100%)
          o: { a: 0, k: 100 }, // Opacity (fully visible)
        },
        ao: 0, // Auto-orient
        ip: startFrame, // In point (when layer starts)
        op: endFrame, // Out point (when layer ends)
        st: startFrame, // Start time
        bm: 0, // Blend mode (normal)
        w: frameSize, // Width
        h: frameSize, // Height
      };
    });

    const lottieJson = {
      v: '5.7.4', // Lottie version
      fr: lottieFps, // Frame rate (60fps is standard)
      ip: 0, // In point (start frame)
      op: totalFrames, // Out point (end frame)
      w: frameSize, // Width
      h: frameSize, // Height
      nm: 'Mascot Animation', // Name
      ddd: 0, // 3D layer flag
      assets: assets,
      layers: layers,
    };

    this.logger.log(`[AnimationGenerationProcessor] Generated Lottie JSON: ${frameCount} frames, ${totalFrames} total frames at ${lottieFps}fps`);
    return lottieJson;
  }

  /**
   * Generate WebM VP9 video with alpha channel
   * Compatible with Chrome, Firefox, Edge, Android
   */
  private async generateWebMVideo(
    frames: Buffer[],
    resolution: number,
    frameCount: number,
    animationId: string,
    timestamp: number,
  ): Promise<string> {
    const fps = 12;
    const tempDir = path.join(os.tmpdir(), `animation-${animationId}-${timestamp}`);
    const outputPath = path.join(tempDir, 'output.webm');

    try {
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write frames to temp directory
      const framePaths: string[] = [];
      for (let i = 0; i < frames.length; i++) {
        const framePath = path.join(tempDir, `frame_${String(i).padStart(4, '0')}.png`);
        fs.writeFileSync(framePath, frames[i]);
        framePaths.push(framePath);
      }

      this.logger.log(`[AnimationGenerationProcessor] Converting ${frames.length} frames to WebM VP9 with alpha...`);

      // Convert to WebM VP9 with alpha using ffmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(path.join(tempDir, 'frame_%04d.png'))
          .inputFPS(fps)
          .outputOptions([
            '-c:v libvpx-vp9', // VP9 codec
            '-pix_fmt yuva420p', // Pixel format with alpha channel
            '-auto-alt-ref 0', // Disable alt-ref frames for better alpha
            '-lag-in-frames 0', // Reduce latency
            '-error-resilient 1', // Error resilience
            '-crf 30', // Quality (lower = better, 30 is good balance)
            '-b:v 0', // Variable bitrate
          ])
          .output(outputPath)
          .on('start', (commandLine) => {
            this.logger.log(`[AnimationGenerationProcessor] FFmpeg command: ${commandLine}`);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              this.logger.log(`[AnimationGenerationProcessor] WebM encoding progress: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            this.logger.log(`[AnimationGenerationProcessor] WebM encoding completed`);
            resolve();
          })
          .on('error', (err) => {
            this.logger.error(`[AnimationGenerationProcessor] WebM encoding error:`, err);
            reject(err);
          })
          .run();
      });

      // Read video file
      const videoBuffer = fs.readFileSync(outputPath);

      // Upload to storage
      const videoKey = `animations/${animationId}/animation-${timestamp}.webm`;
      const videoUrl = await this.storageService.uploadVideo(videoKey, videoBuffer, 'webm');

      // Cleanup temp files
      this.cleanupTempDirectory(tempDir);

      return videoUrl;
    } catch (error) {
      // Cleanup on error
      this.cleanupTempDirectory(tempDir);
      throw error;
    }
  }

  /**
   * Generate MOV HEVC video with alpha channel
   * Compatible with Safari, iOS
   * Note: Requires VideoToolbox on macOS, or will fallback to libx265 (without alpha on Linux)
   */
  private async generateMOVVideo(
    frames: Buffer[],
    resolution: number,
    frameCount: number,
    animationId: string,
    timestamp: number,
  ): Promise<string> {
    const fps = 12;
    const tempDir = path.join(os.tmpdir(), `animation-${animationId}-${timestamp}`);
    const outputPath = path.join(tempDir, 'output.mov');

    try {
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write frames to temp directory
      for (let i = 0; i < frames.length; i++) {
        const framePath = path.join(tempDir, `frame_${String(i).padStart(4, '0')}.png`);
        fs.writeFileSync(framePath, frames[i]);
      }

      this.logger.log(`[AnimationGenerationProcessor] Converting ${frames.length} frames to MOV HEVC with alpha...`);

      // Try VideoToolbox first (macOS), fallback to libx265
      let useVideoToolbox = false;
      try {
        // Check if VideoToolbox is available (macOS only)
        const platform = process.platform;
        if (platform === 'darwin') {
          useVideoToolbox = true;
          this.logger.log(`[AnimationGenerationProcessor] Using VideoToolbox encoder (macOS)`);
        }
      } catch (e) {
        this.logger.log(`[AnimationGenerationProcessor] VideoToolbox not available, using libx265`);
      }

      // Convert to MOV HEVC with alpha
      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg()
          .input(path.join(tempDir, 'frame_%04d.png'))
          .inputFPS(fps)
          .output(outputPath);

        if (useVideoToolbox) {
          // VideoToolbox encoder with alpha (macOS)
          command.outputOptions([
            '-c:v hevc_videotoolbox', // HEVC VideoToolbox encoder
            '-allow_sw 1', // Allow software encoding fallback
            '-alpha_quality 0.75', // Alpha quality (required for alpha channel)
            '-vtag hvc1', // Video tag for compatibility
            '-pix_fmt yuv420p', // Pixel format
            '-crf 23', // Quality
          ]);
        } else {
          // libx265 encoder (Linux/Windows) - Note: alpha may not be fully supported
          this.logger.warn(`[AnimationGenerationProcessor] Using libx265 - alpha channel support may be limited`);
          command.outputOptions([
            '-c:v libx265', // HEVC encoder
            '-pix_fmt yuv420p', // Pixel format (no alpha support in libx265)
            '-crf 23', // Quality
            '-preset medium', // Encoding preset
          ]);
        }

        command
          .on('start', (commandLine) => {
            this.logger.log(`[AnimationGenerationProcessor] FFmpeg command: ${commandLine}`);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              this.logger.log(`[AnimationGenerationProcessor] MOV encoding progress: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            this.logger.log(`[AnimationGenerationProcessor] MOV encoding completed`);
            resolve();
          })
          .on('error', (err) => {
            this.logger.error(`[AnimationGenerationProcessor] MOV encoding error:`, err);
            reject(err);
          })
          .run();
      });

      // Read video file
      const videoBuffer = fs.readFileSync(outputPath);

      // Upload to storage
      const videoKey = `animations/${animationId}/animation-${timestamp}.mov`;
      const videoUrl = await this.storageService.uploadVideo(videoKey, videoBuffer, 'mov');

      // Cleanup temp files
      this.cleanupTempDirectory(tempDir);

      return videoUrl;
    } catch (error) {
      // Cleanup on error
      this.cleanupTempDirectory(tempDir);
      throw error;
    }
  }

  /**
   * Get animation prompt for Replicate Veo based on action
   */
  private getAnimationPrompt(action: AnimationAction, customAction: string | null, mascot: Mascot): string {
    const mascotDetails = mascot.prompt || mascot.metadata?.mascotDetails || '';
    const style = mascot.style || 'cartoon';
    const personality = mascot.personality || 'friendly';

    let actionDescription = '';
    
    if (action === AnimationAction.CUSTOM && customAction) {
      actionDescription = customAction;
    } else {
      const actionMap: Record<AnimationAction, string> = {
        [AnimationAction.WAVE]: 'waving hand, friendly gesture',
        [AnimationAction.CELEBRATE]: 'celebrating, jumping with arms raised, joyful',
        [AnimationAction.THINK]: 'thinking pose, hand on chin, contemplative',
        [AnimationAction.SLEEP]: 'sleeping pose, eyes closed, peaceful',
        [AnimationAction.SAD]: 'sad expression, downcast eyes',
        [AnimationAction.EXERCISE]: 'exercising, active movement, energetic',
        [AnimationAction.BACKFLIP]: 'doing a backflip, rotating, dynamic',
        [AnimationAction.DANCE]: 'dancing, moving rhythmically, joyful',
        [AnimationAction.JUMP]: 'jumping, dynamic movement',
        [AnimationAction.WALK]: 'walking, stepping forward',
        [AnimationAction.RUN]: 'running, fast movement',
        [AnimationAction.IDLE]: 'idle pose, subtle breathing, standing still',
        [AnimationAction.CUSTOM]: customAction || 'animated movement',
      };
      actionDescription = actionMap[action] || 'animated movement';
    }

    return `Create a PERFECT LOOP video of mascot ${actionDescription}. First and last frame EXACTLY identical. Seamless cycle, isolated character clean edges no background.`;
  }

  /**
   * Convert MOV video to WebM VP9 with alpha
   */
  private async convertMOVToWebM(
    movBuffer: Buffer,
    animationId: string,
    timestamp: number,
  ): Promise<string> {
    return this.convertVideoToWebM(movBuffer, animationId, timestamp, 'input.mov');
  }

  /**
   * Convert MP4 (e.g. from Veo) to WebM VP9
   */
  private async convertMP4ToWebM(
    mp4Buffer: Buffer,
    animationId: string,
    timestamp: number,
  ): Promise<string> {
    return this.convertVideoToWebM(mp4Buffer, animationId, timestamp, 'input.mp4');
  }

  private async convertVideoToWebM(
    videoBuffer: Buffer,
    animationId: string,
    timestamp: number,
    inputFileName: string,
  ): Promise<string> {
    const tempDir = path.join(os.tmpdir(), `animation-${animationId}-${timestamp}`);
    const inputPath = path.join(tempDir, inputFileName);
    const webmPath = path.join(tempDir, 'output.webm');

    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.writeFileSync(inputPath, videoBuffer);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-c:v libvpx-vp9',
            '-pix_fmt yuva420p',
            '-auto-alt-ref 0',
            '-crf 30',
            '-b:v 0',
          ])
          .output(webmPath)
          .on('end', () => resolve())
          .on('error', reject)
          .run();
      });

      const webmBuffer = fs.readFileSync(webmPath);
      const webmKey = `animations/${animationId}/animation-${timestamp}.webm`;
      const webmUrl = await this.storageService.uploadVideo(webmKey, webmBuffer, 'webm');
      this.cleanupTempDirectory(tempDir);
      return webmUrl;
    } catch (error) {
      this.cleanupTempDirectory(tempDir);
      throw error;
    }
  }

  /**
   * Extract frames from video for sprite sheet and Lottie
   */
  private async extractFramesFromVideo(videoBuffer: Buffer, frameCount: number): Promise<Buffer[]> {
    const tempDir = path.join(os.tmpdir(), `frames-${Date.now()}`);
    const videoPath = path.join(tempDir, 'video.mov');
    const framesPath = path.join(tempDir, 'frame_%04d.png');

    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(videoPath, videoBuffer);

      // Extract frames
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .outputOptions([
            `-vf fps=12`,
            `-frames:v ${frameCount}`,
          ])
          .output(framesPath)
          .on('end', () => resolve())
          .on('error', reject)
          .run();
      });

      // Read extracted frames
      const frames: Buffer[] = [];
      for (let i = 1; i <= frameCount; i++) {
        const framePath = path.join(tempDir, `frame_${String(i).padStart(4, '0')}.png`);
        if (fs.existsSync(framePath)) {
          frames.push(fs.readFileSync(framePath));
        }
      }

      this.cleanupTempDirectory(tempDir);
      return frames;
    } catch (error) {
      this.cleanupTempDirectory(tempDir);
      this.logger.warn(`[AnimationGenerationProcessor] Frame extraction failed:`, error);
      return [];
    }
  }

  /**
   * Generate sprite sheet from frames
   */
  private async generateSpriteSheetFromFrames(
    frames: Buffer[],
    frameSize: number,
    animationId: string,
    timestamp: number,
  ): Promise<string> {
    const spriteSheet = await this.assembleSpriteSheet(frames, frameSize, frames.length);
    const spriteSheetKey = `animations/${animationId}/sprite-sheet-${timestamp}.png`;
    return await this.storageService.uploadImage(spriteSheetKey, spriteSheet);
  }

  /**
   * Cleanup temporary directory
   */
  private cleanupTempDirectory(tempDir: string): void {
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(tempDir, file));
        }
        fs.rmdirSync(tempDir);
        this.logger.log(`[AnimationGenerationProcessor] Cleaned up temp directory: ${tempDir}`);
      }
    } catch (error) {
      this.logger.warn(`[AnimationGenerationProcessor] Failed to cleanup temp directory:`, error);
    }
  }
}
