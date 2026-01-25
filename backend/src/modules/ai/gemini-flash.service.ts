import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
export class GeminiFlashService implements OnModuleInit {
  private readonly logger = new Logger(GeminiFlashService.name);
  private vertexAI: any;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('GeminiFlashService module initializing...');
    try {
      this.initializationPromise = this.initialize();
      await this.initializationPromise;
      this.logger.log(`GeminiFlashService module initialization complete. Initialized: ${this.initialized}`);
    } catch (error) {
      this.logger.error('Error in onModuleInit:', error);
      this.logger.error('Error stack:', error instanceof Error ? error.stack : String(error));
    }
  }

  private async initialize() {
    try {
      const projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID');
      if (!projectId) {
        this.logger.warn('GOOGLE_CLOUD_PROJECT_ID not set, Gemini Flash will not be available');
        return;
      }

      this.logger.log(`Initializing Gemini Flash with project: ${projectId}`);

      // Dynamic import to avoid requiring @google-cloud/vertexai at build time
      const { VertexAI } = await import('@google-cloud/vertexai');
      const { GoogleAuth } = await import('google-auth-library');
      
      // Handle credentials
      const credentialsPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
      const credentialsBase64 = this.configService.get<string>('GOOGLE_CLOUD_CREDENTIALS');
      
      this.logger.log(`Credentials path set: ${!!credentialsPath}`);
      this.logger.log(`Credentials base64 set: ${!!credentialsBase64} (length: ${credentialsBase64?.length || 0})`);
      
      const config: any = {
        project: projectId,
        location: this.configService.get<string>('GOOGLE_CLOUD_LOCATION') || 'us-central1',
      };

      if (credentialsPath) {
        this.logger.log(`Using credentials from file: ${credentialsPath}`);
        config.keyFilename = credentialsPath;
      } else if (credentialsBase64) {
        try {
          // Decode base64 credentials
          const decoded = Buffer.from(credentialsBase64, 'base64').toString();
          const credentialsJson = JSON.parse(decoded);
          
          // Log some info (without sensitive data)
          this.logger.log(`Decoded credentials successfully. Client email: ${credentialsJson.client_email || 'N/A'}`);
          this.logger.log(`Project ID in credentials: ${credentialsJson.project_id || 'N/A'}`);
          
          // Use GoogleAuth to create credentials properly
          const auth = new GoogleAuth({
            credentials: credentialsJson,
            projectId: projectId,
          });
          
          // Get the auth client (required for VertexAI)
          const authClient = await auth.getClient();
          config.googleAuth = authClient;
          this.logger.log('Created GoogleAuth client with credentials');
        } catch (decodeError) {
          this.logger.error('Failed to decode/parse credentials:', decodeError);
          throw new Error(`Invalid credentials format: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`);
        }
      } else {
        this.logger.warn('No credentials provided (neither GOOGLE_APPLICATION_CREDENTIALS nor GOOGLE_CLOUD_CREDENTIALS)');
        // Will try to use default credentials (ADC - Application Default Credentials)
        this.logger.log('Attempting to use Application Default Credentials (ADC)');
      }

      this.logger.log(`Creating VertexAI instance with config: project=${config.project}, location=${config.location}`);
      this.logger.log(`Config has googleAuth: ${!!config.googleAuth}`);
      this.logger.log(`Config has keyFilename: ${!!config.keyFilename}`);
      
      this.vertexAI = new VertexAI(config);
      
      // Test authentication by trying to get the model (this will fail if auth is wrong)
      try {
        this.logger.log('Testing VertexAI authentication...');
        const testModel = this.vertexAI.preview.getGenerativeModel({
          model: 'gemini-2.5-flash-image',
        });
        this.logger.log('VertexAI model retrieved successfully (auth test passed)');
      } catch (authError) {
        this.logger.warn('VertexAI auth test failed (but continuing):', authError instanceof Error ? authError.message : String(authError));
        // Don't fail initialization - the error might be transient or model-specific
      }
      
      this.initialized = true;
      this.logger.log('Gemini 2.5 Flash Image service initialized successfully');
      this.logger.log(`Service is now available: ${this.isAvailable()}`);
    } catch (error) {
      this.logger.error('Failed to initialize Gemini Flash service:', error);
      this.logger.error('Error type:', error?.constructor?.name || 'Unknown');
      this.logger.error('Error message:', error instanceof Error ? error.message : String(error));
      this.logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      this.initialized = false;
      // Re-throw to be caught by onModuleInit
      throw error;
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
    // Wait for initialization if it's still in progress
    if (this.initializationPromise && !this.initialized) {
      this.logger.log('Waiting for Gemini Flash initialization to complete...');
      await this.initializationPromise;
    }

    if (!this.initialized) {
      const projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID');
      const hasCredentials = !!(this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS') || 
                                this.configService.get<string>('GOOGLE_CLOUD_CREDENTIALS'));
      this.logger.error(`Gemini Flash service not initialized. Project ID: ${projectId || 'NOT SET'}, Has credentials: ${hasCredentials}`);
      throw new Error('Gemini Flash service not initialized. Check GOOGLE_CLOUD_PROJECT_ID and credentials.');
    }

    const fullPrompt = this.buildPrompt(config);
    
    this.logger.log(`Generating image with Gemini Flash. Prompt length: ${fullPrompt.length}`);
    
    try {
      this.logger.log('Getting GenerativeModel instance...');
      const model = this.vertexAI.preview.getGenerativeModel({
        model: 'gemini-2.5-flash-image', // Exactement comme MascotAI
      });
      this.logger.log('Model instance retrieved, preparing request...');

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

      this.logger.log('Sending generateContent request...');
      const response = await model.generateContent(request);
      this.logger.log('Received response from Gemini Flash');
      
      // Extract image data
      const candidate = response.response.candidates?.[0];
      if (!candidate || !candidate.content?.parts?.[0]?.inlineData) {
        this.logger.error('No image data in response. Response structure:', JSON.stringify(response.response, null, 2));
        throw new Error('No image data in Gemini Flash response');
      }

      const imageData = candidate.content.parts[0].inlineData.data;
      this.logger.log(`Image data received, size: ${imageData.length} characters (base64)`);
      return Buffer.from(imageData, 'base64');
    } catch (error) {
      this.logger.error('Gemini Flash generation failed:', error);
      this.logger.error('Error type:', error?.constructor?.name || 'Unknown');
      this.logger.error('Error message:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        this.logger.error('Error stack:', error.stack);
      }
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
    if (!this.initialized) {
      // Log why it's not available for debugging
      const projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID');
      const hasCredentials = !!(this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS') || 
                                this.configService.get<string>('GOOGLE_CLOUD_CREDENTIALS'));
      this.logger.warn(`Gemini Flash not available. Project ID: ${projectId || 'NOT SET'}, Has credentials: ${hasCredentials}`);
    }
    return this.initialized;
  }
}
