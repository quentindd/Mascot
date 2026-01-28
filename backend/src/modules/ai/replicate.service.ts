import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const DEFAULT_POSE_MODEL = 'sdxl-based/consistent-character';
const REPLICATE_API = 'https://api.replicate.com/v1';

/**
 * Replicate API for pose generation (reference image + prompt).
 * Uses consistent-character: same character in new pose, ~$0.01–0.06/gen.
 * Set REPLICATE_API_TOKEN to enable. Optionally set REPLICATE_POSE_MODEL (default: sdxl-based/consistent-character).
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
      this.logger.log(`Poses: Replicate configured (model: ${this.poseModel})`);
    }
  }

  isAvailable(): boolean {
    return !!this.token?.trim();
  }

  /**
   * Generate a pose from a reference image (mascot) + text prompt.
   * Calls sdxl-based/consistent-character: subject image + prompt → new image.
   * Model uses predefined half-body poses; prompt describes the character for consistency.
   */
  async generatePoseFromReference(
    imageUrl: string,
    prompt: string,
    options?: { negativePrompt?: string; seed?: number },
  ): Promise<Buffer> {
    if (!this.token) {
      throw new Error('REPLICATE_API_TOKEN is not set. Cannot use Replicate for poses.');
    }

    try {
      this.logger.log(`[Replicate] Resolving model version for ${this.poseModel}`);
      const version = await this.getLatestVersion();
      this.logger.log('[Replicate] Creating prediction (pose from reference)');

      const createRes = await axios.post(
        `${REPLICATE_API}/predictions`,
        {
          version,
          input: {
            subject: imageUrl,
            prompt: prompt.trim() + '. Same character, same design. Transparent background.',
            negative_prompt: options?.negativePrompt ?? 'text, watermark, lowres, blurry',
            number_of_outputs: 1,
            number_of_images_per_pose: 1,
            randomise_poses: false,
            seed: options?.seed ?? Math.floor(Math.random() * 1e9),
          },
        },
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
        throw new Error('Replicate consistent-character did not return an image URL');
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
    const res = await axios.get(
      `${REPLICATE_API}/models/${this.poseModel}`,
      {
        headers: { Authorization: `Bearer ${this.token}` },
        timeout: 5000,
      },
    );
    const versionId = res.data?.latest_version?.id;
    if (!versionId) {
      throw new Error(`Could not get latest version for ${this.poseModel}`);
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
