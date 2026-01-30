import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { AnimationAction } from '../../../entities/animation-job.entity';

export class CreateAnimationDto {
  @ApiProperty({
    enum: AnimationAction,
    description: 'Action/animation type to generate',
  })
  @IsEnum(AnimationAction)
  action: AnimationAction;

  @ApiPropertyOptional({
    description: 'Custom action description (required when action=CUSTOM). E.g., "playing guitar", "doing a backflip"',
  })
  @IsOptional()
  @IsString()
  customAction?: string;

  @ApiPropertyOptional({ description: 'Figma file ID where this animation will be used' })
  @IsOptional()
  @IsString()
  figmaFileId?: string;
}

export class GenerateDefaultAnimationsDto {
  @ApiPropertyOptional({ description: 'Figma file ID where animations will be used' })
  @IsOptional()
  @IsString()
  figmaFileId?: string;
}

export class AnimationJobResponseDto {
  id: string;
  mascotId: string;
  action: AnimationAction;
  customAction: string | null;
  status: string;
  spriteSheetUrl: string | null;
  webmVideoUrl: string | null;
  movVideoUrl: string | null;
  lottieUrl: string | null;
  frameCount: number | null;
  durationMs: number | null;
  createdAt: Date;
  updatedAt: Date;
}
