import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUrl, IsNotEmpty } from 'class-validator';
import { MascotStyle } from '../../../entities/mascot.entity';

export class CreateMascotDto {
  @ApiProperty({ description: 'Name for the mascot' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Natural language prompt describing the mascot' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({
    enum: MascotStyle,
    description: 'Style preset for the mascot',
  })
  @IsEnum(MascotStyle)
  style: MascotStyle;

  @ApiPropertyOptional({ description: 'Reference image URL for brand matching' })
  @IsOptional()
  @IsUrl()
  referenceImageUrl?: string;

  @ApiPropertyOptional({ description: 'Figma file ID where this mascot will be used' })
  @IsOptional()
  @IsString()
  figmaFileId?: string;
}

export class MascotResponseDto {
  id: string;
  name: string;
  prompt: string;
  style: MascotStyle;
  characterId: string | null;
  status: string;
  fullBodyImageUrl: string | null;
  avatarImageUrl: string | null;
  squareIconUrl: string | null;
  referenceImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
