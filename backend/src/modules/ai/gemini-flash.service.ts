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
          
          // Create a temporary file with credentials for ADC (Application Default Credentials)
          // This is the most reliable way to ensure VertexAI uses the credentials correctly
          const fs = await import('fs');
          const path = await import('path');
          const os = await import('os');
          
          const tempDir = os.tmpdir();
          const tempCredsPath = path.join(tempDir, `google-creds-${Date.now()}.json`);
          
          fs.writeFileSync(tempCredsPath, JSON.stringify(credentialsJson), { mode: 0o600 });
          this.logger.log(`Created temporary credentials file: ${tempCredsPath}`);
          
          // Set environment variable for ADC
          process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredsPath;
          
          // Also create GoogleAuth with scopes for direct use if needed
          const requiredScopes = [
            'https://www.googleapis.com/auth/cloud-platform',
          ];
          
          const auth = new GoogleAuth({
            keyFilename: tempCredsPath,
            projectId: projectId,
            scopes: requiredScopes,
          });
          
          const authClient = await auth.getClient();
          config.googleAuth = authClient;
          this.logger.log('Created GoogleAuth client with temporary credentials file and Vertex AI scopes');
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
      /** When true, prompt keeps exact same character (no new clothing/expression) – for poses */
      isPose?: boolean;
      /** Optional reference image to preserve character identity (image + text prompting). */
      referenceImage?: { data: Buffer; mimeType: string };
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

      const parts: any[] = [];
      if (config.referenceImage?.data && config.referenceImage.mimeType) {
        parts.push({
          inlineData: {
            mimeType: config.referenceImage.mimeType,
            data: config.referenceImage.data.toString('base64'),
          },
        });
      }
      parts.push({ text: fullPrompt });

      const request = {
        contents: [
          {
            role: 'user',
            parts,
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
      
      // Retry logic for rate limiting (429 errors)
      let response;
      let retries = 0;
      const maxRetries = 3;
      const baseDelay = 2000; // 2 seconds
      
      while (retries <= maxRetries) {
        try {
          response = await model.generateContent(request);
          this.logger.log('Received response from Gemini Flash');
          break;
        } catch (error: any) {
          // Check if it's a 429 rate limit error
          if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('Too Many Requests')) {
            if (retries < maxRetries) {
              const delay = baseDelay * Math.pow(2, retries); // Exponential backoff
              this.logger.warn(`Rate limit hit (429). Retrying in ${delay}ms... (attempt ${retries + 1}/${maxRetries + 1})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              retries++;
              continue;
            } else {
              this.logger.error('Rate limit exceeded after all retries. Please wait before trying again.');
              throw error;
            }
          }
          // If it's not a 429 error, throw immediately
          throw error;
        }
      }
      
      // Log full response structure for debugging
      this.logger.log('Response structure:', JSON.stringify({
        hasResponse: !!response.response,
        hasCandidates: !!response.response?.candidates,
        candidatesCount: response.response?.candidates?.length || 0,
        firstCandidateKeys: response.response?.candidates?.[0] ? Object.keys(response.response.candidates[0]) : [],
      }, null, 2));
      
      // Extract image data - try different possible structures
      const candidate = response.response?.candidates?.[0];
      
      if (!candidate) {
        this.logger.error('No candidate in response. Full response:', JSON.stringify(response, null, 2));
        throw new Error('No candidate in Gemini Flash response');
      }
      
      // Try different paths for image data
      // Gemini Flash can return text + image, so we need to search through all parts
      let imageData: string | null = null;
      
      // Search in candidate.content.parts (most common)
      if (candidate.content?.parts) {
        for (let i = 0; i < candidate.content.parts.length; i++) {
          const part = candidate.content.parts[i];
          if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('image/')) {
            imageData = part.inlineData.data;
            this.logger.log(`Found image data in candidate.content.parts[${i}].inlineData.data`);
            break;
          }
        }
      }
      
      // If not found, try candidate.parts
      if (!imageData && candidate.parts) {
        for (let i = 0; i < candidate.parts.length; i++) {
          const part = candidate.parts[i];
          if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('image/')) {
            imageData = part.inlineData.data;
            this.logger.log(`Found image data in candidate.parts[${i}].inlineData.data`);
            break;
          }
        }
      }
      
      // If still not found, try response.response.parts
      if (!imageData && response.response?.parts) {
        for (let i = 0; i < response.response.parts.length; i++) {
          const part = response.response.parts[i];
          if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('image/')) {
            imageData = part.inlineData.data;
            this.logger.log(`Found image data in response.response.parts[${i}].inlineData.data`);
            break;
          }
        }
      }
      
      if (!imageData) {
        this.logger.error('No image data found in any expected location. Full response:', JSON.stringify(response, null, 2));
        this.logger.error('Candidate structure:', JSON.stringify(candidate, null, 2));
        throw new Error('No image data in Gemini Flash response');
      }

      this.logger.log(`Image data received, size: ${imageData.length} characters (base64)`);
      const imageBuffer = Buffer.from(imageData, 'base64');
      this.logger.log(`Image buffer created, size: ${imageBuffer.length} bytes`);
      return imageBuffer;
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
   * Generate an app icon of the mascot in the visual style of a reference logo.
   * Sends mascot image + reference logo image + prompt; returns generated icon buffer.
   */
  async generateLogoInStyle(config: {
    mascotImage: { data: Buffer; mimeType: string };
    referenceLogoImage: { data: Buffer; mimeType: string };
    mascotDetails?: string;
    stylePrompt?: string;
  }): Promise<Buffer> {
    if (this.initializationPromise && !this.initialized) {
      await this.initializationPromise;
    }
    if (!this.initialized) {
      throw new Error('Gemini Flash service not initialized.');
    }

    const prompt = this.buildLogoInStylePrompt(config.mascotDetails, config.stylePrompt);

    const parts: any[] = [
      {
        inlineData: {
          mimeType: config.mascotImage.mimeType,
          data: config.mascotImage.data.toString('base64'),
        },
      },
      {
        inlineData: {
          mimeType: config.referenceLogoImage.mimeType,
          data: config.referenceLogoImage.data.toString('base64'),
        },
      },
      { text: prompt },
    ];

    const model = this.vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
    });

    const request = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.35,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      },
    };

    this.logger.log('[generateLogoInStyle] Sending request (mascot + reference logo)...');
    const response = await this.sendGenerateContentWithRetry(model, request);
    return this.extractImageFromResponse(response);
  }

  private buildLogoInStylePrompt(mascotDetails?: string, stylePrompt?: string): string {
    let p =
      'Image 1 is a mascot character. Image 2 is a reference app logo. ' +
      'Generate a single square app icon (1024x1024) showing ONLY the mascot from image 1, ' +
      'but drawn in the exact same visual style as the reference logo in image 2: same type of colors, shading, line style, and overall look. ' +
      'Keep the mascot\'s identity and design. Do NOT copy the reference logo\'s character or text. ';
    if (stylePrompt?.trim()) {
      p += `User wants the logo to fit the style of: ${stylePrompt.trim()}. `;
    }
    if (mascotDetails?.trim()) {
      p += `Mascot description: ${mascotDetails.trim()}. `;
    }
    p +=
      'The output MUST have a completely transparent background. No text, no words, no letters anywhere. ' +
      'CRITICAL: Transparent background only, no white/gray/colored background. High quality, clean edges.';
    return p;
  }

  /**
   * Generate an app icon from the mascot only (no reference image).
   * Uses platform, text inspiration (e.g. "like Royal Match app") and brand colors to build the best logo.
   */
  async generateLogoFromMascotOnly(config: {
    mascotImage: { data: Buffer; mimeType: string };
    platform?: string;
    referenceAppPrompt?: string;
    brandColors?: string[];
    mascotDetails?: string;
  }): Promise<Buffer> {
    if (this.initializationPromise && !this.initialized) {
      await this.initializationPromise;
    }
    if (!this.initialized) {
      throw new Error('Gemini Flash service not initialized.');
    }

    const prompt = this.buildLogoFromMascotOnlyPrompt(
      config.platform,
      config.referenceAppPrompt,
      config.brandColors,
      config.mascotDetails,
    );

    const parts: any[] = [
      {
        inlineData: {
          mimeType: config.mascotImage.mimeType,
          data: config.mascotImage.data.toString('base64'),
        },
      },
      { text: prompt },
    ];

    const model = this.vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
    });

    const request = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      },
    };

    this.logger.log('[generateLogoFromMascotOnly] Sending request (mascot + text prompt)...');
    this.logger.log('[generateLogoFromMascotOnly] Prompt: ' + prompt);
    const response = await this.sendGenerateContentWithRetry(model, request);
    return this.extractImageFromResponse(response);
  }

  private buildLogoFromMascotOnlyPrompt(
    platform?: string,
    referenceAppPrompt?: string,
    brandColors?: string[],
    mascotDetails?: string,
  ): string {
    let p =
      'You are an expert at creating app icons and logos. ' +
      'The attached image shows a mascot character. Your task: create ONE square image (1024x1024 pixels) that is an app icon / logo featuring THIS EXACT MASCOT. ' +
      'Redraw the mascot clearly: same character, same identity, centered in the frame, filling most of the square. ' +
      'The result must look like a professional app icon (iOS, Android, or web): single character, no scenery, no props, no text, no letters. ';

    if (platform?.trim()) {
      const plat = platform.trim().toLowerCase();
      if (plat.includes('app store') || plat.includes('ios')) {
        p += 'App Store style: polished, premium, clear silhouette, works at 1024px and small sizes. ';
      } else if (plat.includes('google') || plat.includes('play') || plat.includes('android')) {
        p += 'Google Play style: clean, modern, vibrant, recognizable as an icon. ';
      } else if (plat.includes('web')) {
        p += 'Web/PWA style: sharp, scalable, professional icon. ';
      }
    }

    if (referenceAppPrompt?.trim()) {
      p += `Reference style: the user wants the icon to feel like "${referenceAppPrompt.trim()}". ` +
        'Match that kind of visual quality and finish (e.g. polished game icon, casual app icon). ' +
        'Keep ONLY the mascot from the image as the subject; do not copy other characters or logos. ';
    }

    if (brandColors?.length) {
      const hexList = brandColors.slice(0, 3).filter((c) => /^#[0-9A-Fa-f]{6}$/.test(c));
      if (hexList.length) {
        p += `Use these brand colors if possible: ${hexList.join(', ')} (accents, glow, or details). `;
      }
    }

    if (mascotDetails?.trim()) {
      p += `Mascot description: ${mascotDetails.trim()}. `;
    }

    p +=
      'Output: ONE image only. Completely transparent background. No text, no words, no logos, no letters. ' +
      'CRITICAL: Transparent background only. High quality, clean edges, ready for app store submission.';
    return p;
  }

  private async sendGenerateContentWithRetry(model: any, request: any): Promise<any> {
    let response: any;
    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 2000;
    while (retries <= maxRetries) {
      try {
        response = await model.generateContent(request);
        return response;
      } catch (error: any) {
        if (
          error?.message?.includes('429') ||
          error?.message?.includes('RESOURCE_EXHAUSTED') ||
          error?.message?.includes('Too Many Requests')
        ) {
          if (retries < maxRetries) {
            const delay = baseDelay * Math.pow(2, retries);
            this.logger.warn(`Rate limit. Retrying in ${delay}ms... (${retries + 1}/${maxRetries + 1})`);
            await new Promise((r) => setTimeout(r, delay));
            retries++;
            continue;
          }
        }
        throw error;
      }
    }
    return response!;
  }

  private extractImageFromResponse(response: any): Buffer {
    const candidate = response?.response?.candidates?.[0];
    if (!candidate) {
      this.logger.error('No candidate in response.', JSON.stringify(response, null, 2));
      throw new Error('No candidate in Gemini Flash response');
    }
    let imageData: string | null = null;
    if (candidate.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('image/')) {
          imageData = part.inlineData.data;
          break;
        }
      }
    }
    if (!imageData && candidate.parts) {
      for (const part of candidate.parts) {
        if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('image/')) {
          imageData = part.inlineData.data;
          break;
        }
      }
    }
    if (!imageData && response?.response?.parts) {
      for (const part of response.response.parts) {
        if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('image/')) {
          imageData = part.inlineData.data;
          break;
        }
      }
    }
    if (!imageData) {
      this.logger.error('No image data in response.', JSON.stringify(candidate, null, 2));
      throw new Error('No image data in Gemini Flash response');
    }
    return Buffer.from(imageData, 'base64');
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
    isPose?: boolean;
    referenceImage?: { data: Buffer; mimeType: string };
  }): string {
    let prompt = config.mascotDetails || '';
    if (config.isPose && config.referenceImage) {
      prompt = 'The image above is the reference character. Generate a new image of this EXACT same character only. Same design, same colors, same texture, same face. Do NOT add clothing (no suit, no tie, no shirt). Only change the pose or action. ' + prompt;
    }

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

    if (config.isPose) {
      // Pose mode: do NOT add personality or accessories – keep exact same character
      prompt += '. SAME CHARACTER ONLY: Keep the exact same facial expression, same body surface (furry, feathered, smooth, etc.), same appearance. Do NOT add any clothing, suit, tie, shirt, dress, or accessories that are not in the original. Do NOT change the character design. ONLY the pose or action changes. Facing front, full frontal view.';
    } else {
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
      prompt += ', facing front, front view, full frontal pose, character looking at viewer';
      // 4. Body parts (accessories)
      if (config.bodyParts && config.bodyParts.length > 0) {
        prompt += `, wearing ${config.bodyParts.join(', ')}`;
      }
    }

    // 5. Color
    if (config.color) {
      prompt += `, ${config.color} color`;
    }

    // 6. App description (contexte)
    if (config.appDescription) {
      prompt += `, ${config.appDescription} app mascot`;
    }

    // 8. Requirements standards - MUST have transparent background and NO text
    prompt += '. CRITICAL REQUIREMENTS: The character MUST be facing front, full frontal view, looking directly at the viewer. Eyes must have clean pure white eyeballs with no gray tint or stains. The image MUST have a COMPLETELY transparent background with NO background color, NO gray background, NO white background, NO background texture, NO background pattern, NO shadows on background, NO checkerboard pattern, NO grid pattern. The character must be isolated on a 100% transparent background like a PNG cutout with perfect edges. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO BRAND NAME, NO LABELS, NO WRITING, NO TEXT OVERLAY, NO TEXT ON CHARACTER, NO TEXT ON ACCESSORIES, NO TEXT ANYWHERE, NO TEXT ON CLOTHING, NO TEXT ON ITEMS. The character should be a clean cutout with no background visible. High quality professional illustration with clean edges.';

    // 9. Negative prompt
    let negativePromptText = 'background, solid background, white background, gray background, grey background, colored background, checkerboard background, grid background, pattern background, text, words, letters, brand name, labels, writing, text overlay, text on character, text on accessories, text on clothing, text on items, any text, any writing, any letters, any words';
    if (config.isPose) {
      negativePromptText += ', clothing, suit, tie, shirt, dress, business suit, dressed, new accessories, different texture, different expression, different face, different character, different mascot';
    }
    if (config.negativePrompt && config.negativePrompt.trim()) {
      negativePromptText += `, ${config.negativePrompt}`;
    }
    prompt += `. STRICTLY AVOID: ${negativePromptText}`;

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
