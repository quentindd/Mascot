import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Runway ML Video Generation Service
 * 
 * Generates transparent videos directly from images + prompts
 * No need for frame-by-frame generation or FFmpeg assembly
 * 
 * Requires:
 * - RUNWAY_API_KEY
 */
@Injectable()
export class RunwayService implements OnModuleInit {
  private readonly logger = new Logger(RunwayService.name);
  private apiKey: string | null = null;
  private baseUrl = 'https://api.runwayml.com/v1';
  private axiosInstance: AxiosInstance;
  private initialized = false;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RUNWAY_API_KEY') || null;
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 120000, // 2 minutes timeout for video generation
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async onModuleInit() {
    if (this.apiKey) {
      this.initialized = true;
      this.logger.log('Runway ML service initialized');
    } else {
      this.logger.warn('RUNWAY_API_KEY not set, Runway ML will not be available');
      this.initialized = false;
    }
  }

  /**
   * Check if Runway service is available
   */
  isAvailable(): boolean {
    return this.initialized && !!this.apiKey;
  }

  /**
   * Generate a transparent video animation from an image and prompt
   * Uses Runway's image-to-video API
   * 
   * @param options Generation options
   * @returns Video buffer with alpha channel
   */
  async generateVideo(options: {
    imageUrl: string; // URL of the mascot image
    prompt: string; // Animation description (e.g., "waving hand animation")
    duration?: number; // Duration in seconds (default: 1, max 10)
    fps?: number; // Frames per second (default: 12)
    resolution?: number; // Resolution in pixels (default: 360)
    alpha?: boolean; // Include alpha channel (default: true)
  }): Promise<Buffer> {
    if (!this.isAvailable()) {
      throw new Error('Runway ML service not configured. Please set RUNWAY_API_KEY.');
    }

    const {
      imageUrl,
      prompt,
      duration = 1,
      fps = 12,
      resolution = 360,
      alpha = true,
    } = options;

    this.logger.log(`[RunwayService] Generating video: ${prompt} (${duration}s, ${fps}fps, ${resolution}px)`);

    try {
      // Runway API: image-to-video endpoint
      // Documentation: https://docs.dev.runwayml.com/api
      // Endpoint: POST /v1/image_to_video
      
      // Convert resolution to Runway ratio format
      // Runway accepts: 1280:720, 720:1280, 1104:832, 832:1104, 960:960, 1584:672
      // For square videos, use 960:960 (closest to our resolutions)
      const runwayRatio = resolution <= 480 ? '960:960' : '1280:720';
      
      const response = await this.axiosInstance.post(
        '/image_to_video',
        {
          model: this.configService.get<string>('RUNWAY_MODEL') || 'gen3a_turbo', // Default: gen3a_turbo (fast, cheap). Options: gen3a_turbo, gen4_turbo, gen4
          promptImage: imageUrl, // HTTPS URL of the mascot image
          promptText: prompt, // Animation description
          duration: Math.min(Math.max(duration, 2), 10), // 2-10 seconds (Runway minimum is 2s)
          ratio: runwayRatio, // Video resolution ratio
          seed: Math.floor(Math.random() * 4294967295), // Random seed for variation
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Runway-Version': '2024-11-06', // Latest API version
          },
        }
      );

      // Handle response - could be immediate or async
      let videoUrl: string;

      if (response.data.video_url || response.data.output) {
        // Immediate response with video URL
        videoUrl = response.data.video_url || response.data.output[0] || response.data.output;
      } else if (response.data.task_id || response.data.id) {
        // Async response, need to poll
        const taskId = response.data.task_id || response.data.id;
        this.logger.log(`[RunwayService] Task created: ${taskId}, polling for completion...`);
        videoUrl = await this.pollForCompletion(taskId);
      } else {
        throw new Error('Unexpected response format from Runway API');
      }

      // Download the video
      this.logger.log(`[RunwayService] Downloading video from: ${videoUrl}`);
      const videoResponse = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });

      const videoBuffer = Buffer.from(videoResponse.data);
      this.logger.log(`[RunwayService] Video downloaded: ${videoBuffer.length} bytes`);

      return videoBuffer;
    } catch (error) {
      this.logger.error(`[RunwayService] Failed to generate video:`, error);
      this.logger.error(`[RunwayService] Error details:`, error instanceof Error ? error.message : String(error));
      
      if (axios.isAxiosError(error)) {
        this.logger.error(`[RunwayService] Response status: ${error.response?.status}`);
        this.logger.error(`[RunwayService] Response data:`, JSON.stringify(error.response?.data, null, 2));
      }
      
      throw error;
    }
  }

  /**
   * Poll for task completion
   */
  private async pollForCompletion(taskId: string, maxAttempts: number = 60): Promise<string> {
    const pollInterval = 3000; // 3 seconds (Runway can take 30-60 seconds)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await this.axiosInstance.get(
          `/tasks/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'X-Runway-Version': '2024-11-06',
            },
          }
        );

        const status = statusResponse.data.status || 
                      statusResponse.data.state || 
                      statusResponse.data.task?.status;
        
        this.logger.log(`[RunwayService] Task ${taskId} status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);

        if (status === 'completed' || status === 'succeeded' || status === 'SUCCEEDED') {
          const videoUrl = statusResponse.data.output?.[0] || 
                          statusResponse.data.result?.video_url ||
                          statusResponse.data.video_url ||
                          statusResponse.data.task?.output?.[0];
          
          if (videoUrl) {
            this.logger.log(`[RunwayService] Task completed, video URL: ${videoUrl}`);
            return videoUrl;
          } else {
            this.logger.error(`[RunwayService] Video URL not found in response:`, JSON.stringify(statusResponse.data, null, 2));
            throw new Error('Video URL not found in response');
          }
        }

        if (status === 'failed' || status === 'error' || status === 'FAILED') {
          const errorMessage = statusResponse.data.error || 
                              statusResponse.data.message || 
                              statusResponse.data.task?.error ||
                              'Generation failed';
          throw new Error(`Runway generation failed: ${errorMessage}`);
        }

        // Still processing (pending, processing, in_progress, etc.)
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            // Task not found yet, might still be creating
            this.logger.log(`[RunwayService] Task ${taskId} not found yet, waiting...`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            attempts++;
            continue;
          }
          if (error.response?.status === 429) {
            // Rate limited, wait longer
            this.logger.warn(`[RunwayService] Rate limited, waiting longer...`);
            await new Promise(resolve => setTimeout(resolve, pollInterval * 2));
            attempts++;
            continue;
          }
        }
        throw error;
      }
    }

    throw new Error(`Runway generation timeout after ${maxAttempts} attempts (${maxAttempts * pollInterval / 1000} seconds)`);
  }

}
