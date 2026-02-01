import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Mascot } from '../../../entities/mascot.entity';
import { LogoPack, LogoPackStatus, LogoSize } from '../../../entities/logo-pack.entity';
import { StorageService } from '../../storage/storage.service';
import { GeminiFlashService } from '../../ai/gemini-flash.service';
import { ReplicateService } from '../../ai/replicate.service';
import { removeBackground } from '../../../common/utils/background-removal.util';
import * as sharp from 'sharp';
import axios from 'axios';

type SizeSpec = { name: string; width: number; height: number };

/** App Store (iOS): 1024 required + standard icon sizes for iPhone/iPad. */
const APP_STORE_SIZES: SizeSpec[] = [
  { name: 'ios-1024', width: 1024, height: 1024 },
  { name: 'ios-180', width: 180, height: 180 },
  { name: 'ios-167', width: 167, height: 167 },
  { name: 'ios-152', width: 152, height: 152 },
  { name: 'ios-120', width: 120, height: 120 },
  { name: 'ios-87', width: 87, height: 87 },
  { name: 'ios-80', width: 80, height: 80 },
  { name: 'ios-76', width: 76, height: 76 },
  { name: 'ios-60', width: 60, height: 60 },
  { name: 'ios-58', width: 58, height: 58 },
  { name: 'ios-40', width: 40, height: 40 },
  { name: 'ios-29', width: 29, height: 29 },
  { name: 'ios-20', width: 20, height: 20 },
];

/** Google Play (Android): 512 required + common densities. */
const GOOGLE_PLAY_SIZES: SizeSpec[] = [
  { name: 'android-512', width: 512, height: 512 },
  { name: 'android-192', width: 192, height: 192 },
  { name: 'android-96', width: 96, height: 96 },
  { name: 'android-48', width: 48, height: 48 },
];

/** Web (PWA): 512 + 192 required, plus common sizes. */
const WEB_SIZES: SizeSpec[] = [
  { name: 'web-512', width: 512, height: 512 },
  { name: 'web-192', width: 192, height: 192 },
  { name: 'web-152', width: 152, height: 152 },
  { name: 'web-144', width: 144, height: 144 },
  { name: 'web-96', width: 96, height: 96 },
  { name: 'web-72', width: 72, height: 72 },
  { name: 'web-48', width: 48, height: 48 },
];

function getSizesForPlatform(platform?: string): SizeSpec[] {
  const p = (platform || '').trim().toLowerCase();
  if (p === 'app store') return APP_STORE_SIZES;
  if (p === 'google play') return GOOGLE_PLAY_SIZES;
  if (p === 'web') return WEB_SIZES;
  return [...APP_STORE_SIZES, ...GOOGLE_PLAY_SIZES.filter((s) => s.name !== 'android-512'), ...WEB_SIZES.filter((s) => s.width !== 512 && s.width !== 192)];
}

@Processor('logo-pack-generation')
export class LogoPackGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(LogoPackGenerationProcessor.name);

  constructor(
    @InjectRepository(Mascot)
    private mascotRepository: Repository<Mascot>,
    @InjectRepository(LogoPack)
    private logoPackRepository: Repository<LogoPack>,
    private storageService: StorageService,
    private geminiFlashService: GeminiFlashService,
    private replicateService: ReplicateService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { logoPackId, mascotId, imageSource, brandColors, referenceLogoUrl, platform } = job.data;

    this.logger.log(`[LogoPack] Starting logo pack ${logoPackId} for mascot ${mascotId} (platform: ${platform ?? 'all'}, refLogo: ${referenceLogoUrl ? 'yes' : 'no'})`);

    try {
      await this.logoPackRepository.update(logoPackId, { status: LogoPackStatus.GENERATING });

      const mascot = await this.mascotRepository.findOne({ where: { id: mascotId } });
      if (!mascot) throw new Error(`Mascot ${mascotId} not found`);

      let imageBuffer: Buffer;

      if (referenceLogoUrl && referenceLogoUrl.trim()) {
        imageBuffer = await this.generateLogoWithStyleReference(mascot, imageSource, referenceLogoUrl, platform);
      } else {
        const sourceUrl = this.getSourceUrl(mascot, imageSource);
        if (!sourceUrl) throw new Error('Mascot has no image for selected source (fullBody, avatar or squareIcon)');
        const res = await axios.get<ArrayBuffer>(sourceUrl, { responseType: 'arraybuffer', timeout: 20000 });
        imageBuffer = Buffer.from(res.data);
      }

      imageBuffer = await sharp(imageBuffer)
        .ensureAlpha()
        .png({ compressionLevel: 9, force: true })
        .toBuffer();

      const sizeSpecs = getSizesForPlatform(platform);
      const transparentBg = { r: 0, g: 0, b: 0, alpha: 0 };
      const sizes: LogoSize[] = [];
      const timestamp = Date.now();

      for (const spec of sizeSpecs) {
        const resized = await sharp(imageBuffer)
          .ensureAlpha()
          .resize(spec.width, spec.height, {
            fit: 'contain',
            background: transparentBg,
            withoutEnlargement: false,
          })
          .png({ compressionLevel: 9, force: true })
          .toBuffer();

        const key = `logo-packs/${mascotId}/${logoPackId}-${spec.name}-${timestamp}.png`;
        const url = await this.storageService.uploadImage(key, resized);
        sizes.push({ name: spec.name, width: spec.width, height: spec.height, url });
      }

      await this.logoPackRepository.update(logoPackId, {
        sizes,
        status: LogoPackStatus.COMPLETED,
        metadata: {
          generatedAt: new Date().toISOString(),
          imageSource: imageSource ?? 'auto',
          referenceLogoUrl: referenceLogoUrl || null,
          platform: platform || null,
        } as Record<string, any>,
        errorMessage: null,
      });

      this.logger.log(`[LogoPack] Completed ${logoPackId} with ${sizes.length} sizes`);
      return { success: true, logoPackId, sizes: sizes.length };
    } catch (error) {
      this.logger.error(`[LogoPack] Failed ${logoPackId}:`, error);
      await this.logoPackRepository.update(logoPackId, {
        status: LogoPackStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async generateLogoWithStyleReference(
    mascot: Mascot,
    imageSource: string | undefined,
    referenceLogoUrl: string,
    platform?: string,
  ): Promise<Buffer> {
    if (!this.geminiFlashService.isAvailable()) {
      throw new Error('AI service is not configured. Reference logo style requires Gemini Flash. Set GOOGLE_CLOUD_PROJECT_ID and credentials.');
    }
    const sourceUrl = this.getSourceUrl(mascot, imageSource);
    if (!sourceUrl) throw new Error('Mascot has no image for selected source (fullBody, avatar or squareIcon)');

    const [mascotRes, refRes] = await Promise.all([
      axios.get<ArrayBuffer>(sourceUrl, { responseType: 'arraybuffer', timeout: 20000 }),
      axios.get<ArrayBuffer>(referenceLogoUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        validateStatus: (s) => s === 200,
        maxContentLength: 10 * 1024 * 1024,
      }),
    ]);

    const contentType = (refRes.headers['content-type'] || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      throw new Error(`Reference URL must return an image (got ${contentType}). Use a direct image URL (PNG/JPEG/WebP).`);
    }
    const mascotBuffer = Buffer.from(mascotRes.data as ArrayBuffer);
    const refBuffer = Buffer.from(refRes.data as ArrayBuffer);
    const mascotPng = await sharp(mascotBuffer).ensureAlpha().png({ force: true }).toBuffer();
    const refPng = await sharp(refBuffer).ensureAlpha().png({ force: true }).toBuffer();

    this.logger.log('[LogoPack] Calling AI to generate logo in reference style...');
    let generated = await this.geminiFlashService.generateLogoInStyle({
      mascotImage: { data: mascotPng, mimeType: 'image/png' },
      referenceLogoImage: { data: refPng, mimeType: 'image/png' },
      mascotDetails: mascot.prompt || undefined,
      stylePrompt: platform?.trim() ? `Platform: ${platform.trim()}` : undefined,
    });
    this.logger.log('[LogoPack] Removing background from AI-generated logo (rembg-enhance then local)...');
    try {
      generated = await this.replicateService.removeBackgroundReplicate(generated);
      this.logger.log('[LogoPack] Background removal (rembg-enhance) completed');
    } catch (rembgErr) {
      this.logger.warn(
        '[LogoPack] rembg-enhance failed (REPLICATE_API_TOKEN or API error), using local removal only:',
        rembgErr instanceof Error ? rembgErr.message : rembgErr,
      );
    }
    generated = await removeBackground(generated, {
      aggressive: false,
      eraseSemiTransparentBorder: true,
      borderAlphaThreshold: 100,
      eraseWhiteOutline: true,
    });
    return generated;
  }

  private getSourceUrl(mascot: Mascot, imageSource?: string): string | null {
    if (imageSource === 'fullBody') return mascot.fullBodyImageUrl ?? null;
    if (imageSource === 'avatar') return mascot.avatarImageUrl ?? null;
    if (imageSource === 'squareIcon') return mascot.squareIconUrl ?? null;
    return mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.squareIconUrl || null;
  }
}
