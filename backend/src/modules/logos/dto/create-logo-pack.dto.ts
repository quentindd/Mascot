import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsHexColor, IsIn, IsUrl } from 'class-validator';

export const LOGO_IMAGE_SOURCES = ['fullBody', 'avatar', 'squareIcon'] as const;
export type LogoImageSource = (typeof LOGO_IMAGE_SOURCES)[number];

export const LOGO_BACKGROUNDS = ['transparent', 'white', 'brand'] as const;
export type LogoBackground = (typeof LOGO_BACKGROUNDS)[number];

export class CreateLogoPackDto {
  @ApiPropertyOptional({
    description: 'Brand colors in hex format (e.g., ["#FF5733", "#33FF57"]). Used for "brand" background and metadata.',
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
  @IsIn(LOGO_IMAGE_SOURCES)
  imageSource?: LogoImageSource;

  @ApiPropertyOptional({
    description: 'Logo background: transparent, white, or brand (uses first brand color)',
    enum: LOGO_BACKGROUNDS,
  })
  @IsOptional()
  @IsIn(LOGO_BACKGROUNDS)
  background?: LogoBackground;

  @ApiPropertyOptional({
    description: 'URL of a reference app logo image. AI will adapt the mascot logo to match this style (colors, shading, look). Must be a direct image URL (PNG/JPEG/WebP).',
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
