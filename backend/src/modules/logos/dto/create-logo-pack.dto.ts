import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsHexColor, IsIn, IsUrl } from 'class-validator';

export const LOGO_IMAGE_SOURCES = ['fullBody', 'avatar', 'squareIcon'] as const;
export type LogoImageSource = (typeof LOGO_IMAGE_SOURCES)[number];

export class CreateLogoPackDto {
  @ApiPropertyOptional({
    description: 'Brand colors in hex (Primary, Secondary, Tertiary). Same as mascot creation.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsHexColor({ each: true })
  brandColors?: string[];

  @ApiPropertyOptional({
    description: 'Which mascot image to use for the logo',
    enum: LOGO_IMAGE_SOURCES,
  })
  @IsOptional()
  @IsString()
  @IsIn(LOGO_IMAGE_SOURCES)
  imageSource?: LogoImageSource;

  @ApiPropertyOptional({
    description: 'Platform for logo dimensions: "App Store" (iOS), "Google Play" (Android), or "Web" (PWA). Outputs only the sizes required for that platform.',
  })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({
    description: 'URL of a reference app logo image. AI will adapt the mascot logo to match this style. Must be a direct image URL (PNG/JPEG/WebP).',
  })
  @IsOptional()
  @IsUrl({ require_tld: true, protocols: ['https'] })
  referenceLogoUrl?: string;

  @ApiPropertyOptional({ description: 'Figma file ID where logo pack will be used' })
  @IsOptional()
  @IsString()
  figmaFileId?: string;
}

export class LogoPackResponseDto {
  id: string;
  mascotId: string;
  status: string;
  brandColors: string[] | null;
  sizes: Array<{
    name: string;
    width: number;
    height: number;
    url: string;
  }>;
  zipFileUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
