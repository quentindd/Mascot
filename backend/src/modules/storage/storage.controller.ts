import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload-image')
  @ApiOperation({ summary: 'Upload an image (base64) and get public URL' })
  async uploadImage(
    @Body() body: { image: string },
    @Request() req,
  ): Promise<{ url: string }> {
    const base64 = body?.image;
    if (!base64 || typeof base64 !== 'string') {
      throw new BadRequestException('Body must include "image" (base64 string)');
    }
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length === 0) {
      throw new BadRequestException('Invalid base64 image');
    }
    const key = `uploads/${req.user.id}/${Date.now()}.png`;
    const url = await this.storageService.uploadImage(key, buffer);
    return { url };
  }
}
