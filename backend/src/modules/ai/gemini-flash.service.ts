import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Google Gemini 2.5 Flash Image Service via Vertex AI
 * 
 * Exactement comme MascotAI.app utilise
 * 
 * Requires:
 * - GOOGLE_CLOUD_PROJECT_ID
 * - GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)
 * - Or: GOOGLE_CLOUD_CREDENTIALS (base64 encoded JSON)
 */
@Injectable()
export class GeminiFlashService {
  private readonly logger = new Logger(GeminiFlashService.name);
  private vertexAI: any;
  private initialized = false;

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private async initialize() {
    try {
      const projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID');
      if (!projectId) {
        this.logger.warn('GOOGLE_CLOUD_PROJECT_ID not set, Gemini Flash will not be available');
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
      this.logger.log('Gemini 2.5 Flash Image service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Gemini Flash service:', error);
    }
  }

  /**
   * Generate a mascot image using Gemini 2.5 Flash Image
   * Structure exacte comme MascotAI.app
   */
  async generateImage(
    config: {
      mascotDetails: string;
      type: string;
      style: string;
      personality: string;
      bodyParts?: string[];
      color?: string;
      brandName?: string;
      appDescription?: string;
      negativePrompt?: string;
      aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
      seed?: number;
    }
  ): Promise<Buffer> {
    if (!this.initialized) {
      throw new Error('Gemini Flash service not initialized. Check GOOGLE_CLOUD_PROJECT_ID and credentials.');
    }

    const fullPrompt = this.buildPrompt(config);
    
    try {
      const model = this.vertexAI.preview.getGenerativeModel({
        model: 'gemini-2.5-flash-image', // Exactement comme MascotAI
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
        throw new Error('No image data in Gemini Flash response');
      }

      const imageData = candidate.content.parts[0].inlineData.data;
      return Buffer.from(imageData, 'base64');
    } catch (error) {
      this.logger.error('Gemini Flash generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate multiple variations (for batch generation)
   */
  async generateVariations(
    config: {
      mascotDetails: string;
      type: string;
      style: string;
      personality: string;
      bodyParts?: string[];
      color?: string;
      brandName?: string;
      appDescription?: string;
      negativePrompt?: string;
      aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    },
    count: number = 4
  ): Promise<Buffer[]> {
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(
        this.generateImage({
          ...config,
          seed: Date.now() + i, // Different seed for each variation
        })
      );
    }
    return Promise.all(promises);
  }

  /**
   * Build prompt EXACTEMENT comme MascotAI.app
   */
  private buildPrompt(config: {
    mascotDetails: string;
    type: string;
    style: string;
    personality: string;
    bodyParts?: string[];
    color?: string;
    brandName?: string;
    appDescription?: string;
    negativePrompt?: string;
  }): string {
    let prompt = config.mascotDetails || '';

    // 1. Type
    if (config.type && config.type !== 'auto') {
      prompt += `, ${config.type} character`;
    }

    // 2. Style (exactement comme MascotAI)
    const styleMap: Record<string, string> = {
      kawaii: 'kawaii style, cute, chibi, big eyes, pastel colors, soft shading',
      minimal: 'minimalist design, clean lines, simple shapes, flat colors',
      '3d_pixar': '3D Pixar animation style, smooth surfaces, vibrant colors, professional rendering',
      '3d': '3D render, Blender, C4D, octane render, high detail, professional rendering',
      cartoon: 'cartoon style, 2D illustration, vibrant colors, clean lines',
      flat: 'flat design, minimal, vector style, no shadows, solid colors',
      pixel: 'pixel art, 8-bit, retro game style, low resolution',
      hand_drawn: 'hand-drawn illustration, sketch style, artistic',
      match_brand: 'professional mascot design, brand-appropriate style',
    };

    if (config.style && styleMap[config.style]) {
      prompt += `, ${styleMap[config.style]}`;
    }

    // 3. Personality
    const personalityMap: Record<string, string> = {
      friendly: 'friendly expression, welcoming, approachable',
      professional: 'professional appearance, business-appropriate, polished',
      playful: 'playful expression, fun, energetic',
      cool: 'cool appearance, modern, stylish',
      energetic: 'energetic pose, dynamic, active',
      calm: 'calm expression, peaceful, serene',
    };

    if (config.personality && personalityMap[config.personality]) {
      prompt += `, ${personalityMap[config.personality]}`;
    }

    // 4. Body parts (accessories) - exactement comme MascotAI
    if (config.bodyParts && config.bodyParts.length > 0) {
      prompt += `, wearing ${config.bodyParts.join(', ')}`;
    }

    // 5. Color
    if (config.color) {
      prompt += `, ${config.color} color`;
    }

    // 6. App description (contexte)
    if (config.appDescription) {
      prompt += `, ${config.appDescription} app mascot`;
    }

    // 7. Brand name
    if (config.brandName) {
      prompt += `, mascot for ${config.brandName}`;
    }

    // 8. Requirements standards
    prompt += ', mascot character, transparent background, high quality, professional illustration, clean edges';

    // 9. Negative prompt
    if (config.negativePrompt && config.negativePrompt.trim()) {
      prompt += `, avoid: ${config.negativePrompt}`;
    }

    return prompt.trim();
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.initialized;
  }
}
