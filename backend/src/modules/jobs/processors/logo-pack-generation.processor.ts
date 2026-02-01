import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Mascot } from '../../../entities/mascot.entity';
import { LogoPack, LogoPackStatus, LogoSize } from '../../../entities/logo-pack.entity';
import { StorageService } from '../../storage/storage.service';
import { ReplicateService } from '../../ai/replicate.service';
import * as sharp from 'sharp';

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

@Processor('logo-pack-generation')
export class LogoPackGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(LogoPackGenerationProcessor.name);

  constructor(
    @InjectRepository(Mascot)
    private mascotRepository: Repository<Mascot>,
    @InjectRepository(LogoPack)
    private logoPackRepository: Repository<LogoPack>,
    private storageService: StorageService,
    private replicateService: ReplicateService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { logoPackId, mascotId, imageSource, brandColors, referenceLogoUrl, stylePrompt } = job.data;

    this.logger.log(`[LogoPack] Starting logo pack ${logoPackId} for mascot ${mascotId} (imageSource: ${imageSource ?? 'auto'}, stylePrompt: ${stylePrompt ? 'yes' : 'no'})`);

    try {
      await this.logoPackRepository.update(logoPackId, { status: LogoPackStatus.GENERATING });

      const mascot = await this.mascotRepository.findOne({ where: { id: mascotId } });
      if (!mascot) throw new Error(`Mascot ${mascotId} not found`);

      let imageBuffer: Buffer;

      // Logo generation uses only GPT via Replicate (openai/gpt-image-1.5).
      if (!this.replicateService.isAvailable()) {
        throw new Error('Logo generation requires REPLICATE_API_TOKEN. Set it in your environment.');
      }
      imageBuffer = await this.generateLogoFromMascotOnlyReplicate(
        mascot,
        imageSource,
        referenceLogoUrl?.trim() ? `Style reference: user provided a reference logo. ${stylePrompt ?? ''}`.trim() : stylePrompt,
        brandColors,
      );

      imageBuffer = await sharp(imageBuffer)
        .ensureAlpha()
        .png({ compressionLevel: 9, force: true })
        .toBuffer();

      const sizeSpecs = APP_STORE_SIZES;
      const sizes: LogoSize[] = [];
      const timestamp = Date.now();

      // Keep transparency - no opaque background (just the logo)
      for (const spec of sizeSpecs) {
        const resized = await sharp(imageBuffer)
          .resize(spec.width, spec.height, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
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
          stylePrompt: stylePrompt || null,
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

  /** Logo from mascot using Replicate openai/gpt-image-1.5 (only model used for logos). */
  private async generateLogoFromMascotOnlyReplicate(
    mascot: Mascot,
    imageSource: string | undefined,
    stylePrompt?: string,
    brandColors?: string[],
  ): Promise<Buffer> {
    this.logger.log(`[LogoPack] getSourceUrl: imageSource=${imageSource}, available: fullBody=${!!mascot.fullBodyImageUrl}, avatar=${!!mascot.avatarImageUrl}, squareIcon=${!!mascot.squareIconUrl}`);
    const sourceUrl = this.getSourceUrl(mascot, imageSource);
    if (!sourceUrl) throw new Error(`Mascot has no image for selected source "${imageSource}" (fullBody, avatar or squareIcon)`);
    this.logger.log(`[LogoPack] Passing mascot image URL to Replicate: ${sourceUrl.substring(0, 80)}...`);

    // Pass the HTTPS URL directly to Replicate (preferred over base64 data URIs)
    const generated = await this.replicateService.generateLogoGptImageReplicate(sourceUrl, {
      referenceAppPrompt: stylePrompt?.trim() || undefined,
      brandColors: Array.isArray(brandColors) ? brandColors : undefined,
      mascotDetails: mascot.prompt || undefined,
    }, { size: '1024x1024', quality: 'high' });
    return sharp(generated).ensureAlpha().png({ compressionLevel: 9, force: true }).toBuffer();
  }

  private getSourceUrl(mascot: Mascot, imageSource?: string): string | null {
    if (imageSource === 'fullBody') return mascot.fullBodyImageUrl ?? null;
    if (imageSource === 'avatar') return mascot.avatarImageUrl ?? null;
    if (imageSource === 'squareIcon') return mascot.squareIconUrl ?? null;
    return mascot.fullBodyImageUrl || mascot.avatarImageUrl || mascot.squareIconUrl || null;
  }
}
