import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';

/**
 * OpenAI GPT Image API (images/edits) for logo generation from mascot image + prompt.
 * Same kind of flow as ChatGPT image edit: better logo results than Gemini for this use case.
 *
 * Requires: OPENAI_API_KEY
 *
 * Pricing (GPT Image 1.5, 1024x1024): Low ~$0.009, Medium ~$0.034, High ~$0.133 per image.
 * See https://platform.openai.com/docs/pricing
 */
@Injectable()
export class OpenAIImageService {
  private readonly logger = new Logger(OpenAIImageService.name);
  private client: OpenAI | null = null;
  private available = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey?.trim()) {
      this.client = new OpenAI({ apiKey: apiKey.trim() });
      this.available = true;
      this.logger.log('OpenAI Image service initialized (GPT Image for logos).');
    } else {
      this.logger.warn('OPENAI_API_KEY not set, OpenAI logo generation will not be available.');
    }
  }

  isAvailable(): boolean {
    return this.available && this.client !== null;
  }

  /**
   * Generate an app icon / logo from a mascot image using GPT Image (edit endpoint).
   * Same logic as ChatGPT: image + prompt → edited image.
   */
  async generateLogoFromMascot(config: {
    mascotImageBuffer: Buffer;
    platform?: string;
    referenceAppPrompt?: string;
    brandColors?: string[];
    mascotDetails?: string;
  }): Promise<Buffer> {
    if (!this.client) {
      throw new Error('OpenAI Image service not configured. Set OPENAI_API_KEY.');
    }

    const prompt = this.buildLogoPrompt(
      config.platform,
      config.referenceAppPrompt,
      config.brandColors,
      config.mascotDetails,
    );

    this.logger.log('[OpenAI Image] Generating logo with gpt-image-1.5 (edit)...');
    this.logger.log('[OpenAI Image] Prompt: ' + prompt);

    const file = await toFile(config.mascotImageBuffer, 'mascot.png', { type: 'image/png' });

    const response = await this.client.images.edit({
      model: 'gpt-image-1.5',
      image: file,
      prompt,
      size: '1024x1024',
      quality: 'high',
      background: 'opaque',
      stream: false,
    });

    const b64 = (response as any).data?.[0]?.b64_json;
    if (!b64) {
      this.logger.error('[OpenAI Image] No b64_json in response.', JSON.stringify(response, null, 2));
      throw new Error('OpenAI Image API did not return an image.');
    }

    return Buffer.from(b64, 'base64');
  }

  private buildLogoPrompt(
    platform?: string,
    referenceAppPrompt?: string,
    brandColors?: string[],
    mascotDetails?: string,
  ): string {
    let p =
      'Turn this image into a professional app icon / logo. ' +
      'Keep the same character (mascot) as the only subject, centered, filling most of the frame. ' +
      'The result must be a single square app icon suitable for App Store, Google Play, or web: clean, recognizable at small sizes, no text or letters. ';

    if (platform?.trim()) {
      const plat = platform.trim().toLowerCase();
      if (plat.includes('app store') || plat.includes('ios')) {
        p += 'Style: App Store quality, polished, premium. ';
      } else if (plat.includes('google') || plat.includes('play') || plat.includes('android')) {
        p += 'Style: Google Play, clean, modern, vibrant. ';
      } else if (plat.includes('web')) {
        p += 'Style: Web/PWA icon, sharp, scalable. ';
      }
    }

    if (referenceAppPrompt?.trim()) {
      p += `Make it feel like: "${referenceAppPrompt.trim()}" (same kind of visual quality and style). `;
    }

    if (brandColors?.length) {
      const hexList = brandColors.slice(0, 3).filter((c) => /^#[0-9A-Fa-f]{6}$/.test(c));
      if (hexList.length) {
        p += `Use these brand colors if possible: ${hexList.join(', ')}. `;
      }
    }

    if (mascotDetails?.trim()) {
      p += `Context: ${mascotDetails.trim()}. `;
    }

    p +=
      ' Output: one image only, no text, no words. OPAQUE background only: solid white or a single solid brand color (no transparency). App Store and Google Play require opaque backgrounds; square corners. Professional app icon ready for store submission.';
    return p;
  }
}
