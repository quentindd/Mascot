import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PosesService } from './poses.service';
import { CreatePoseDto } from './dto/create-pose.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('poses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PosesController {
  constructor(private readonly posesService: PosesService) {}

  @Post('mascots/:id/poses')
  create(@Param('id') mascotId: string, @Body() dto: CreatePoseDto, @Request() req) {
    return this.posesService.create(mascotId, dto, req.user.id);
  }

  @Get('mascots/:id/poses')
  async findByMascot(@Param('id') mascotId: string) {
    const poses = await this.posesService.findByMascot(mascotId);
    return { data: poses };
  }

  @Get('poses/:id')
  findOne(@Param('id') id: string) {
    return this.posesService.findOne(id);
  }

  @Get('poses/:id/status')
  getStatus(@Param('id') id: string) {
    return this.posesService.getStatus(id);
  }
}
