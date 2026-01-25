import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Google Imagen 4 Service via Vertex AI
 * 
 * Requires:
 * - GOOGLE_CLOUD_PROJECT_ID
 * - GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)
 * - Or: GOOGLE_CLOUD_CREDENTIALS (base64 encoded JSON)
 */
@Injectable()
export class Imagen4Service {
  private readonly logger = new Logger(Imagen4Service.name);
  private vertexAI: any;
  private initialized = false;

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private async initialize() {
    try {
      const projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID');
      if (!projectId) {
        this.logger.warn('GOOGLE_CLOUD_PROJECT_ID not set, Imagen 4 will not be available');
        return;
      }

      // Dynamic import to avoid requiring @google-cloud/vertexai at build time
      const { VertexAI } = await import('@google-cloud/vertexai');
      
      // Handle credentials
      const credentialsPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
      const credentialsBase64 = this.configService.get<string>('GOOGLE_CLOUD_CREDENTIALS');
      
      const config: any = {
        project: projectId,
        location: this.configService.get<string>('GOOGLE_CLOUD_LOCATION') || 'us-central1',
      };

      if (credentialsPath) {
        config.keyFilename = credentialsPath;
      } else if (credentialsBase64) {
        // Decode base64 credentials
        const credentials = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString());
        config.credentials = credentials;
      }

      this.vertexAI = new VertexAI(config);
      this.initialized = true;
      this.logger.log('Imagen 4 service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Imagen 4 service:', error);
    }
  }

  /**
   * Generate a mascot image using Imagen 4
   */
  async generateImage(
    prompt: string,
    style: string,
    options?: {
      negativePrompt?: string;
      brandColors?: { primary?: string; secondary?: string; tertiary?: string };
      accessories?: string[];
      personality?: string;
      aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
      seed?: number;
    }
  ): Promise<Buffer> {
    if (!this.initialized) {
      throw new Error('Imagen 4 service not initialized. Check GOOGLE_CLOUD_PROJECT_ID and credentials.');
    }

    const fullPrompt = this.buildPrompt(prompt, style, options);
    
    try {
      const model = this.vertexAI.preview.getGenerativeModel({
        model: 'imagegeneration@006', // Imagen 4
      });

      const request = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: fullPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1024,
        },
      };

      const response = await model.generateContent(request);
      
      // Extract image data
      const candidate = response.response.candidates?.[0];
      if (!candidate || !candidate.content?.parts?.[0]?.inlineData) {
        throw new Error('No image data in Imagen 4 response');
      }

      const imageData = candidate.content.parts[0].inlineData.data;
      return Buffer.from(imageData, 'base64');
    } catch (error) {
      this.logger.error('Imagen 4 generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate multiple variations (for batch generation)
   */
  async generateVariations(
    prompt: string,
    style: string,
    count: number = 4,
    options?: {
      negativePrompt?: string;
      brandColors?: { primary?: string; secondary?: string; tertiary?: string };
      accessories?: string[];
      personality?: string;
    }
  ): Promise<Buffer[]> {
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(
        this.generateImage(prompt, style, {
          ...options,
          seed: Date.now() + i, // Different seed for each variation
        })
      );
    }
    return Promise.all(promises);
  }

  /**
   * Build optimized prompt for Imagen 4
   */
  private buildPrompt(
    basePrompt: string,
    style: string,
    options?: {
      negativePrompt?: string;
      brandColors?: { primary?: string; secondary?: string; tertiary?: string };
      accessories?: string[];
      personality?: string;
    }
  ): string {
    let prompt = basePrompt;

    // Add style
    const stylePrompts: Record<string, string> = {
      kawaii: 'kawaii style, cute, chibi, big eyes, pastel colors, soft shading',
      minimal: 'minimalist design, clean lines, simple shapes, flat colors',
      '3d_pixar': '3D Pixar animation style, smooth surfaces, vibrant colors, professional rendering',
      '3d': '3D render, Blender, C4D, octane render, high detail',
      cartoon: 'cartoon style, 2D illustration, vibrant colors, clean lines',
      flat: 'flat design, minimal, vector style, no shadows, solid colors',
      pixel: 'pixel art, 8-bit, retro game style, low resolution',
      hand_drawn: 'hand-drawn illustration, sketch style, artistic',
      match_brand: 'professional mascot design, brand-appropriate style',
    };

    if (stylePrompts[style]) {
      prompt += `, ${stylePrompts[style]}`;
    }

    // Add personality
    if (options?.personality) {
      const personalityPrompts: Record<string, string> = {
        friendly: 'friendly expression, welcoming, approachable',
        professional: 'professional appearance, business-appropriate, polished',
        playful: 'playful expression, fun, energetic',
        cool: 'cool appearance, modern, stylish',
        energetic: 'energetic pose, dynamic, active',
        calm: 'calm expression, peaceful, serene',
      };
      if (personalityPrompts[options.personality]) {
        prompt += `, ${personalityPrompts[options.personality]}`;
      }
    }

    // Add accessories
    if (options?.accessories && options.accessories.length > 0) {
      prompt += `, wearing ${options.accessories.join(', ')}`;
    }

    // Add brand colors
    if (options?.brandColors) {
      if (options.brandColors.primary) {
        prompt += `, primary color: ${options.brandColors.primary}`;
      }
      if (options.brandColors.secondary) {
        prompt += `, secondary color: ${options.brandColors.secondary}`;
      }
      if (options.brandColors.tertiary) {
        prompt += `, accent color: ${options.brandColors.tertiary}`;
      }
    }

    // Add mascot-specific requirements
    prompt += ', mascot character, transparent background, high quality, professional illustration, clean edges';

    // Add negative prompt
    if (options?.negativePrompt) {
      prompt += `, avoid: ${options.negativePrompt}`;
    }

    return prompt;
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.initialized;
  }
}
