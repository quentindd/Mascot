import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { AnimationAction } from '../../../entities/animation-job.entity';

export class CreateAnimationDto {
  @ApiProperty({
    enum: AnimationAction,
    description: 'Action/animation type to generate',
  })
  @IsEnum(AnimationAction)
  action: AnimationAction;

  @ApiPropertyOptional({
    description: 'Resolution in pixels',
    enum: [128, 240, 360, 480, 720],
    default: 360,
  })
  @IsOptional()
  @IsInt()
  @Min(128)
  @Max(720)
  resolution?: number = 360;

  @ApiPropertyOptional({ description: 'Figma file ID where this animation will be used' })
  @IsOptional()
  @IsString()
  figmaFileId?: string;
}

export class GenerateDefaultAnimationsDto {
  @ApiPropertyOptional({
    description: 'Resolution in pixels',
    enum: [128, 240, 360, 480, 720],
    default: 360,
  })
  @IsOptional()
  @IsInt()
  @Min(128)
  @Max(720)
  resolution?: number = 360;

  @ApiPropertyOptional({ description: 'Figma file ID where animations will be used' })
  @IsOptional()
  @IsString()
  figmaFileId?: string;
}

export class AnimationJobResponseDto {
  id: string;
  mascotId: string;
  action: AnimationAction;
  status: string;
  resolution: number;
  spriteSheetUrl: string | null;
  webmVideoUrl: string | null;
  movVideoUrl: string | null;
  lottieUrl: string | null;
  frameCount: number | null;
  durationMs: number | null;
  createdAt: Date;
  updatedAt: Date;
}
