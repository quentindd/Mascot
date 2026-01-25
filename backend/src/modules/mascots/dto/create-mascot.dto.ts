import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUrl, IsNotEmpty, IsArray, IsBoolean, IsObject, IsInt, Min, Max, ValidateIf } from 'class-validator';
import { MascotStyle, MascotType, MascotPersonality, LifeStage } from '../../../entities/mascot.entity';
import { Type } from 'class-transformer';

export class BrandColorsDto {
  @ApiPropertyOptional({ description: 'Primary brand color (hex)' })
  @IsOptional()
  @IsString()
  primary?: string;

  @ApiPropertyOptional({ description: 'Secondary brand color (hex)' })
  @IsOptional()
  @IsString()
  secondary?: string;

  @ApiPropertyOptional({ description: 'Tertiary brand color (hex)' })
  @IsOptional()
  @IsString()
  tertiary?: string;
}

export class CreateMascotDto {
  @ApiProperty({ description: 'Name for the mascot / Brand name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Natural language prompt describing the mascot (mascotDetails)' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  // Alias pour compatibilité MascotAI
  @ApiPropertyOptional({ description: 'Mascot details (alias for prompt, like MascotAI)' })
  @IsOptional()
  @IsString()
  mascotDetails?: string;

  @ApiPropertyOptional({ description: 'Brand name (alias for name, like MascotAI)' })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional({ description: 'App description (for context, like MascotAI)' })
  @IsOptional()
  @IsString()
  appDescription?: string;

  @ApiProperty({
    enum: MascotStyle,
    description: 'Style preset for the mascot',
  })
  @IsEnum(MascotStyle)
  style: MascotStyle;

  @ApiPropertyOptional({
    enum: MascotType,
    description: 'Type of mascot (auto-detected if not specified)',
    default: MascotType.AUTO,
  })
  @IsOptional()
  @ValidateIf((o) => o.type !== undefined && o.type !== null)
  @IsEnum(MascotType, { message: 'type must be a valid MascotType' })
  @Type(() => String)
  type?: MascotType;

  @ApiPropertyOptional({
    enum: MascotPersonality,
    description: 'Personality preset',
    default: MascotPersonality.FRIENDLY,
  })
  @IsOptional()
  @ValidateIf((o) => o.personality !== undefined && o.personality !== null)
  @IsEnum(MascotPersonality, { message: 'personality must be a valid MascotPersonality' })
  @Type(() => String)
  personality?: MascotPersonality;

  @ApiPropertyOptional({ description: 'Negative prompt: elements to exclude' })
  @IsOptional()
  @IsString()
  negativePrompt?: string;

  @ApiPropertyOptional({ description: 'Array of accessory names (wings, cape, glasses, etc.)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accessories?: string[];

  // Alias pour compatibilité MascotAI
  @ApiPropertyOptional({ description: 'Body parts / accessories (alias for accessories, like MascotAI)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bodyParts?: string[];

  @ApiPropertyOptional({ description: 'Simple color string (like MascotAI: "orange", "purple", etc.)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Brand colors in hex format' })
  @IsOptional()
  @IsObject()
  @Type(() => BrandColorsDto)
  brandColors?: BrandColorsDto;

  @ApiPropertyOptional({ description: 'Advanced mode: use raw custom prompt' })
  @IsOptional()
  @ValidateIf((o) => o.advancedMode !== undefined && o.advancedMode !== null)
  @IsBoolean({ message: 'advancedMode must be a boolean' })
  @Type(() => Boolean)
  advancedMode?: boolean;

  @ApiPropertyOptional({ description: 'URL used for auto-fill (App Store, Play Store, or website)' })
  @IsOptional()
  @IsUrl()
  autoFillUrl?: string;

  @ApiPropertyOptional({ description: 'Reference image URL for brand matching' })
  @IsOptional()
  @IsUrl()
  referenceImageUrl?: string;

  @ApiPropertyOptional({ description: 'Figma file ID where this mascot will be used' })
  @IsOptional()
  @IsString()
  figmaFileId?: string;

  @ApiPropertyOptional({ description: 'Number of variations to generate (1-4)', default: 3 })
  @IsOptional()
  @ValidateIf((o) => o.numVariations !== undefined && o.numVariations !== null)
  @IsInt({ message: 'numVariations must be an integer' })
  @Type(() => Number)
  @Min(1)
  @Max(4)
  numVariations?: number;

  @ApiPropertyOptional({ 
    description: 'Aspect ratio for the image (like MascotAI)',
    enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    default: '1:1'
  })
  @IsOptional()
  @IsString()
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export class MascotResponseDto {
  id: string;
  name: string;
  prompt: string;
  style: MascotStyle;
  type: MascotType;
  personality: MascotPersonality;
  negativePrompt: string | null;
  accessories: string[] | null;
  brandColors: BrandColorsDto | null;
  advancedMode: boolean;
  autoFillUrl: string | null;
  lifeStage: LifeStage | null;
  parentMascotId: string | null;
  variationIndex: number;
  batchId: string | null;
  characterId: string | null;
  status: string;
  fullBodyImageUrl: string | null;
  avatarImageUrl: string | null;
  squareIconUrl: string | null;
  referenceImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
