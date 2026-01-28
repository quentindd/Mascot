import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Logger, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Readable } from 'stream';
import { PosesService } from './poses.service';
import { CreatePoseDto } from './dto/create-pose.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('poses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PosesController {
  private readonly logger = new Logger(PosesController.name);

  constructor(private readonly posesService: PosesService) {
    this.logger.log('PosesController initialized - Routes: POST /mascots/:id/poses, GET /mascots/:id/poses, GET /poses/:id, GET /poses/:id/status');
  }

  @Post('mascots/:id/poses')
  create(@Param('id') mascotId: string, @Body() dto: CreatePoseDto, @Request() req) {
    return this.posesService.create(mascotId, dto, req.user.id);
  }

  @Get('mascots/:id/poses')
  async findByMascot(@Param('id') mascotId: string) {
    try {
      const poses = await this.posesService.findByMascot(mascotId);
      const toIso = (d: Date | string | null | undefined): string | null =>
        d == null ? null : d instanceof Date ? d.toISOString() : String(d);
      return {
        data: poses.map((p) => ({
          id: String(p.id),
          mascotId: String(p.mascotId),
          prompt: p.prompt ?? null,
          status: String(p.status ?? 'pending'),
          imageUrl: p.imageUrl ?? null,
          errorMessage: p.errorMessage ?? null,
          figmaFileId: p.figmaFileId ?? null,
          createdAt: toIso(p.createdAt),
          updatedAt: toIso(p.updatedAt),
        })),
      };
    } catch (err) {
      this.logger.error(`GET mascots/${mascotId}/poses failed`, err instanceof Error ? err.stack : String(err));
      throw err;
    }
  }

  @Get('poses/:id')
  findOne(@Param('id') id: string) {
    return this.posesService.findOne(id);
  }

  @Get('poses/:id/status')
  getStatus(@Param('id') id: string) {
    return this.posesService.getStatus(id);
  }

  @Get('poses/:id/image')
  @ApiOperation({ summary: 'Get pose image (proxy for CORS-safe display in Figma plugin)' })
  async getImage(@Param('id') id: string, @Request() req) {
    const buffer = await this.posesService.getImageBuffer(id, req.user.id);
    return new StreamableFile(Readable.from(buffer), {
      type: 'image/png',
      disposition: 'inline',
    });
  }

  @Delete('poses/:id')
  @ApiOperation({ summary: 'Delete a pose' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.posesService.remove(id, req.user.id);
    return { message: 'Pose deleted successfully' };
  }
}
