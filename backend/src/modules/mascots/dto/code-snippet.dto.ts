import { ApiProperty } from '@nestjs/swagger';

export enum CodeSnippetPlatform {
  HTML = 'html',
  REACT = 'react',
  EXPO = 'expo',
  FLUTTER = 'flutter',
  IOS_SWIFT = 'ios_swift',
  ANDROID_KOTLIN = 'android_kotlin',
}

export class CodeSnippetResponseDto {
  @ApiProperty({ description: 'Platform name' })
  platform: CodeSnippetPlatform;

  @ApiProperty({ description: 'Code snippet' })
  code: string;

  @ApiProperty({ description: 'Description' })
  description: string;
}

export class ExportFormatsResponseDto {
  @ApiProperty({ description: 'WebM URL (Chrome, Firefox, Edge)' })
  webmUrl: string | null;

  @ApiProperty({ description: 'MOV URL (Safari, iOS, macOS)' })
  movUrl: string | null;

  @ApiProperty({ description: 'PNG URL (static image)' })
  pngUrl: string | null;

  @ApiProperty({ description: 'Code snippets for all platforms' })
  snippets: CodeSnippetResponseDto[];
}
