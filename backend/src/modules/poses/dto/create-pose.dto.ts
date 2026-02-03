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

  @ApiPropertyOptional({ description: 'Color to apply to the mascot (e.g. "blue", "red")' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Negative prompt: things to avoid in the generated image' })
  @IsOptional()
  @IsString()
  negativePrompt?: string;
}
