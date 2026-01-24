import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsHexColor } from 'class-validator';

export class CreateLogoPackDto {
  @ApiPropertyOptional({
    description: 'Brand colors in hex format (e.g., ["#FF5733", "#33FF57"])',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsHexColor({ each: true })
  brandColors?: string[];

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
