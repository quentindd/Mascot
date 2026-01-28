import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
    const poses = await this.posesService.findByMascot(mascotId);
    return {
      data: poses.map((p) => ({
        id: p.id,
        mascotId: p.mascotId,
        prompt: p.prompt,
        status: p.status,
        imageUrl: p.imageUrl,
        errorMessage: p.errorMessage,
        figmaFileId: p.figmaFileId,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
      })),
    };
  }

  @Get('poses/:id')
  findOne(@Param('id') id: string) {
    return this.posesService.findOne(id);
  }

  @Get('poses/:id/status')
  getStatus(@Param('id') id: string) {
    return this.posesService.getStatus(id);
  }

  @Delete('poses/:id')
  @ApiOperation({ summary: 'Delete a pose' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.posesService.remove(id, req.user.id);
    return { message: 'Pose deleted successfully' };
  }
}
