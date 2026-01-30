import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const DEFAULT_POSE_MODEL = 'prunaai/flux-kontext-fast';
const REPLICATE_API = 'https://api.replicate.com/v1';
const REMBG_MODEL = 'cjwbw/rembg';
/** Video animation: image-to-video (Replicate), 4s, 16:9 720p, ~0.4¢/video. Model: https://replicate.com/google/veo-3.1-fast */
const VEO_FAST_MODEL = 'google/veo-3.1-fast';
/** Image editing (poses): mascot-only edits, no background, 1080p. Model: https://replicate.com/google/nano-banana */
const NANO_BANANA_MODEL = 'google/nano-banana';

/** Kontext (BFL): input_image + prompt. */
const KONTEXT_BFL_MODELS = ['black-forest-labs/flux-kontext-pro', 'black-forest-labs/flux-kontext-dev'];
/** Kontext (Pruna): img_cond_path + prompt. Match by owner or model name. */
const KONTEXT_PRUNA_MODELS = ['prunaai/flux-kontext-fast', 'prunaai/flux-kontext-dev'];
/** SeedEdit: preserves image details, targeted edits only. Good for mascots/cartoons. */
const SEEDEDIT_MODELS = ['bytedance/seededit-3.0'];

/**
 * Replicate API.
 * Poses: Nano Banana only (editImageNanoBanana). Kontext/SeedEdit (generatePoseFromReference) is legacy/unused for poses.
 * Animations: Veo 3.1 Fast. Background removal: rembg.
 */
@Injectable()
export class ReplicateService {
  private readonly logger = new Logger(ReplicateService.name);
  private readonly token: string | undefined;
  private readonly poseModel: string;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('REPLICATE_API_TOKEN');
    this.poseModel =
      this.configService.get<string>('REPLICATE_POSE_MODEL')?.trim() || DEFAULT_POSE_MODEL;
    if (this.token?.trim()) {
      const poseProvider = this.useNanoBananaForPoses() ? 'Nano Banana' : this.poseModel;
      this.logger.log(`Replicate configured (poses: ${poseProvider}; animations: Veo 3.1 Fast)`);
    }
  }

  /** True when REPLICATE_POSE_MODEL is nano-banana (or google/nano-banana). */
  useNanoBananaForPoses(): boolean {
    const m = (this.poseModel || '').toLowerCase();
    return m === 'nano-banana' || m === 'google/nano-banana' || m.includes('nano-banana');
  }

  /** Current pose model id (for logging). */
  getPoseModelId(): string {
    return this.poseModel || DEFAULT_POSE_MODEL;
  }

  isAvailable(): boolean {
    return !!this.token?.trim();
  }

  /**
   * Remove background from an image using Replicate rembg (real cutout, transparent).
   * Use after pose generation to get a clean detouré without gray/white background.
   */
  async removeBackgroundReplicate(imageBuffer: Buffer): Promise<Buffer> {
    if (!this.token) {
      throw new Error('REPLICATE_API_TOKEN is not set. Cannot use Replicate for background removal.');
    }
    const dataUri = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    try {
      this.logger.log('[Replicate] Running rembg for background removal...');
      const version = await this.getModelVersion(REMBG_MODEL);
      const createRes = await axios.post(
        `${REPLICATE_API}/predictions`,
        { version, input: { image: dataUri } },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );
      const predictionId = createRes.data?.id;
      if (!predictionId) throw new Error('Replicate rembg did not return prediction id');
      const output = await this.waitForPrediction(predictionId, 60000);
      const imageUrlOut = this.extractOutputUrl(output);
      if (!imageUrlOut) throw new Error('Replicate rembg did not return an image URL');
      const imageResponse = await axios.get<ArrayBuffer>(imageUrlOut, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      this.logger.log('[Replicate] rembg completed');
      return Buffer.from(imageResponse.data);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.detail ?? err.message ?? 'Unknown error';
        throw new Error(`Replicate rembg failed: ${msg}`);
      }
      throw err;
    }
  }

  /**
   * Generate a short video from a single image (first frame = same as input) via Veo 3.1 Fast.
   * Used for mascot animations: 4s, 16:9 720p, no audio, prompt should include "seamless infinite loop".
   * Cost ~0.4¢/video on Replicate.
   * Returns buffer and predictionUrl so the run appears in your Replicate dashboard (same token = same account).
   */
  async generateVideoVeo(options: {
    imageUrl: string;
    prompt: string;
    duration?: number;
    resolution?: '720p' | '1080p';
    aspectRatio?: '16:9' | '9:16';
    generateAudio?: boolean;
  }): Promise<{ buffer: Buffer; predictionUrl?: string }> {
    if (!this.token) {
      throw new Error('REPLICATE_API_TOKEN is not set. Cannot use Replicate for video (Veo).');
    }

    const {
      imageUrl,
      prompt,
      duration = 4,
      resolution = '720p',
      aspectRatio = '16:9',
      generateAudio = false,
    } = options;

    try {
      this.logger.log(`[Replicate] Veo 3.1 Fast: generating video (${duration}s, ${resolution}, ${aspectRatio})...`);
      const version = await this.getModelVersion(VEO_FAST_MODEL);

      const input: Record<string, unknown> = {
        image: imageUrl,
        prompt,
        duration: Math.min(Math.max(duration, 4), 8),
        resolution,
        generate_audio: generateAudio,
      };
      if (aspectRatio) {
        input.aspect_ratio = aspectRatio;
      }

      const createRes = await axios.post(
        `${REPLICATE_API}/predictions`,
        { version, input },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      const predictionId = createRes.data?.id;
      const predictionWebUrl = createRes.data?.urls?.web as string | undefined;
      if (!predictionId) throw new Error('Replicate API did not return prediction id for Veo');
      if (predictionWebUrl) {
        this.logger.log(`[Replicate] Veo prediction (view in your dashboard): ${predictionWebUrl}`);
      }

      const output = await this.waitForPrediction(predictionId, 300000);
      const videoUrl = this.extractOutputUrl(output);
      if (!videoUrl) throw new Error('Replicate Veo did not return a video URL');

      this.logger.log('[Replicate] Downloading Veo video');
      const videoResponse = await axios.get<ArrayBuffer>(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });
      const buffer = Buffer.from(videoResponse.data);
      return { buffer, predictionUrl: predictionWebUrl };
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const msg = err.response?.data?.detail ?? err.message ?? 'Unknown error';
        if (status === 401) {
          throw new Error('Invalid REPLICATE_API_TOKEN. Get a token at replicate.com/account/api-tokens');
        }
        if (status === 403) {
          throw new Error('Replicate API access denied (403). Check your REPLICATE_API_TOKEN.');
        }
        if (status === 404) {
          throw new Error('Replicate Veo model not found. Check REPLICATE_API_TOKEN.');
        }
        throw new Error(`Replicate Veo API error (${String(status ?? 'network')}): ${msg}`);
      }
      throw err;
    }
  }

  /**
   * Edit an image with Nano Banana (Google Gemini 2.5 image editing).
   * Used for poses: modification applies only to the mascot, no background, 1080p.
   * Model: https://replicate.com/google/nano-banana
   */
  async editImageNanoBanana(
    imageUrl: string,
    prompt: string,
    options?: { resolution?: '1080p' | '1k' | '2k' },
  ): Promise<Buffer> {
    if (!this.token) {
      throw new Error('REPLICATE_API_TOKEN is not set. Cannot use Replicate for Nano Banana.');
    }

    const resolution = options?.resolution ?? '1080p';
    const nanoPrompt =
      `${prompt.trim()} CRITICAL: The modification applies only to the mascot/character—do not change or add background. No background (transparent or remove background). Output in 1080p for optimal quality. Same character, same style, same design.`;

    try {
      this.logger.log(`[Replicate] Nano Banana: editing image (resolution: ${resolution})...`);
      const version = await this.getModelVersion(NANO_BANANA_MODEL);

      const input: Record<string, unknown> = {
        prompt: nanoPrompt,
        image_input: [imageUrl],
        output_format: 'png',
      };
      if (resolution) {
        input.resolution = resolution === '1080p' ? '1k' : resolution;
      }

      const createRes = await axios.post(
        `${REPLICATE_API}/predictions`,
        { version, input },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      const predictionId = createRes.data?.id;
      const predictionWebUrl = createRes.data?.urls?.web;
      if (!predictionId) throw new Error('Replicate Nano Banana did not return prediction id');
      if (predictionWebUrl) {
        this.logger.log(`[Replicate] Nano Banana prediction: ${predictionWebUrl}`);
      }

      const output = await this.waitForPrediction(predictionId, 120000);
      const imageUrlOut = this.extractOutputUrl(output);
      if (!imageUrlOut) throw new Error('Replicate Nano Banana did not return an image URL');

      this.logger.log('[Replicate] Downloading Nano Banana output');
      const imageResponse = await axios.get<ArrayBuffer>(imageUrlOut, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      return Buffer.from(imageResponse.data);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const msg = err.response?.data?.detail ?? err.message ?? 'Unknown error';
        if (status === 401) {
          throw new Error('Invalid REPLICATE_API_TOKEN. Get a token at replicate.com/account/api-tokens');
        }
        if (status === 403) {
          throw new Error('Replicate API access denied (403). Check your REPLICATE_API_TOKEN.');
        }
        if (status === 404) {
          throw new Error('Replicate Nano Banana model not found. Check REPLICATE_API_TOKEN.');
        }
        throw new Error(`Replicate Nano Banana API error (${String(status ?? 'network')}): ${msg}`);
      }
      throw err;
    }
  }

  /**
   * Legacy: generate pose from reference (Kontext/SeedEdit). Not used for poses; poses use editImageNanoBanana only.
   * Kept for optional use via REPLICATE_POSE_MODEL if needed elsewhere.
   */
  async generatePoseFromReference(
    imageUrl: string,
    prompt: string,
    options?: { negativePrompt?: string; seed?: number },
  ): Promise<Buffer> {
    if (!this.token) {
      throw new Error('REPLICATE_API_TOKEN is not set. Cannot use Replicate for poses.');
    }

    const modelLower = this.poseModel.toLowerCase();
    const isKontextBfl = KONTEXT_BFL_MODELS.some((m) => this.poseModel === m || modelLower.includes('flux-kontext'));
    // Pruna models use img_cond_path (not input_image). Check Pruna before BFL.
    const isKontextPruna = modelLower.includes('prunaai') || modelLower.includes('flux-kontext-fast');
    const isSeedEdit = SEEDEDIT_MODELS.some((m) => this.poseModel === m || this.poseModel.includes('seededit'));
    const fullPrompt = isSeedEdit
      ? `Only change the pose or action to: ${prompt.trim()}. Do not denature: keep exactly the same body parts as the reference (no human hands/arms if reference has wings or paws). Same character, same illustration style, same colors, same design. Do not make it realistic or photorealistic. Transparent background.`
      : isKontextBfl || isKontextPruna
        ? `${prompt.trim()} Preserve the exact same character. Same body parts as reference only—zero hands, zero arms, zero fingers if reference has none. Do not add any limb. No glow, no aura, no halo. Flat colors. Completely transparent background only. Do not convert to photo or realistic. No text, no watermark.`
        : prompt.trim() + '. Same character, same design. Transparent background. No text, no watermark.';

    try {
      this.logger.log(`[Replicate] Using model: ${this.poseModel}`);
      if (isKontextPruna) {
        this.logger.log(`[Replicate] Pruna model: sending img_cond_path + prompt (imageUrl length: ${imageUrl?.length ?? 0})`);
      }
      const version = await this.getLatestVersion();
      this.logger.log(`[Replicate] Creating prediction (pose from reference) with ${this.poseModel}`);

      if (isKontextPruna && !imageUrl?.trim()) {
        throw new Error('Pose generation (Pruna) requires a reference image URL. Mascot has no image.');
      }
      const input = isSeedEdit
        ? { image: imageUrl, prompt: fullPrompt, ...(options?.seed != null && { seed: options.seed }) }
        : isKontextPruna
          ? (() => {
              const prunaInput: Record<string, unknown> = {
                img_cond_path: imageUrl,
                prompt: fullPrompt,
              };
              if (options?.seed != null) prunaInput.seed = options.seed;
              return prunaInput;
            })()
          : isKontextBfl
            ? {
                input_image: imageUrl,
                prompt: fullPrompt,
                ...(options?.seed != null && { seed: options.seed }),
              }
            : {
              subject: imageUrl,
              prompt: fullPrompt,
              negative_prompt: options?.negativePrompt ?? 'text, watermark, lowres, blurry',
              number_of_outputs: 1,
              number_of_images_per_pose: 1,
              randomise_poses: false,
              seed: options?.seed ?? Math.floor(Math.random() * 1e9),
            };

      if (isKontextPruna) {
        this.logger.log(`[Replicate] Input keys: ${Object.keys(input).join(', ')}`);
      }
      const createRes = await axios.post(
        `${REPLICATE_API}/predictions`,
        { version, input },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const predictionId = createRes.data?.id;
      const predictionWebUrl = createRes.data?.urls?.web;
      if (!predictionId) {
        throw new Error('Replicate API did not return prediction id');
      }
      if (predictionWebUrl) {
        this.logger.log(`[Replicate] Prediction created: ${predictionWebUrl} (same token = same account on replicate.com)`);
      }

      const output = await this.waitForPrediction(predictionId);
      const imageUrlOut = this.extractOutputUrl(output);
      if (!imageUrlOut) {
        throw new Error(`Replicate (${this.poseModel}) did not return an image URL`);
      }

      this.logger.log('[Replicate] Downloading output image');
      const imageResponse = await axios.get<ArrayBuffer>(imageUrlOut, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      return Buffer.from(imageResponse.data);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const msg = err.response?.data?.detail ?? err.message ?? 'Unknown error';
        if (status === 401) {
          throw new Error('Invalid REPLICATE_API_TOKEN. Get a token at replicate.com/account/api-tokens');
        }
        if (status === 403) {
          throw new Error('Replicate API access denied (403). Check your REPLICATE_API_TOKEN.');
        }
        if (status === 404) {
          throw new Error('Replicate model or version not found. Check REPLICATE_API_TOKEN and model name.');
        }
        throw new Error(`Replicate API error (${String(status ?? 'network')}): ${msg}`);
      }
      throw err;
    }
  }

  private extractOutputUrl(output: unknown): string | null {
    if (typeof output === 'string' && output.startsWith('http')) return output;
    if (Array.isArray(output)) {
      const first = output[0];
      if (typeof first === 'string' && first.startsWith('http')) return first;
      if (first && typeof first === 'object' && 'url' in first && typeof (first as { url: string }).url === 'string') {
        return (first as { url: string }).url;
      }
    }
    return null;
  }

  private async getLatestVersion(): Promise<string> {
    return this.getModelVersion(this.poseModel);
  }

  private async getModelVersion(modelId: string): Promise<string> {
    const res = await axios.get(`${REPLICATE_API}/models/${modelId}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      timeout: 5000,
    });
    const versionId = res.data?.latest_version?.id;
    if (!versionId) {
      throw new Error(`Could not get latest version for ${modelId}`);
    }
    return versionId;
  }

  private async waitForPrediction(predictionId: string, maxWaitMs = 120000): Promise<string | string[]> {
    const pollInterval = 2000;
    const started = Date.now();

    while (Date.now() - started < maxWaitMs) {
      const res = await axios.get(`${REPLICATE_API}/predictions/${predictionId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
        timeout: 5000,
      });

      const status = res.data.status;
      if (status === 'succeeded') {
        return res.data.output;
      }
      if (status === 'failed' || status === 'canceled') {
        const err = res.data.error ?? res.data.logs ?? status;
        throw new Error(`Replicate prediction ${status}: ${err}`);
      }

      await new Promise((r) => setTimeout(r, pollInterval));
    }

    throw new Error('Replicate prediction timed out');
  }
}
