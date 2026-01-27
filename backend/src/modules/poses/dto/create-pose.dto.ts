import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePoseDto {
  @ApiProperty({
    description: 'Custom prompt describing the pose or modification (e.g., "waving", "change color to blue", "smiling happily")',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ description: 'Figma file ID for tracking' })
  @IsOptional()
  @IsString()
  figmaFileId?: string;
}
