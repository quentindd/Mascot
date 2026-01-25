import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty } from 'class-validator';

export class AutoFillRequestDto {
  @ApiProperty({ description: 'App Store, Play Store, or website URL' })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

export class AutoFillResponseDto {
  @ApiProperty({ description: 'Extracted app/product name' })
  name: string;

  @ApiProperty({ description: 'Extracted description' })
  description: string;

  @ApiProperty({ description: 'Suggested prompt for mascot generation' })
  suggestedPrompt: string;

  @ApiProperty({ description: 'Detected mascot type' })
  suggestedType: string;

  @ApiProperty({ description: 'Detected brand colors (if available)' })
  brandColors?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}
