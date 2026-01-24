import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnimationsService } from './animations.service';
import { CreateAnimationDto, GenerateDefaultAnimationsDto } from './dto/create-animation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('animations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AnimationsController {
  constructor(private readonly animationsService: AnimationsService) {}

  @Post('mascots/:id/animations')
  create(@Param('id') mascotId: string, @Body() dto: CreateAnimationDto, @Request() req) {
    return this.animationsService.create(mascotId, dto, req.user.id);
  }

  @Post('mascots/:id/animations/generate-default')
  generateDefault(@Param('id') mascotId: string, @Body() dto: GenerateDefaultAnimationsDto, @Request() req) {
    return this.animationsService.generateDefault(mascotId, dto, req.user.id);
  }

  @Get('mascots/:id/animations')
  findByMascot(@Param('id') mascotId: string) {
    return this.animationsService.findByMascot(mascotId);
  }

  @Get('animations/:id')
  findOne(@Param('id') id: string) {
    return this.animationsService.findOne(id);
  }

  @Get('animations/:id/status')
  getStatus(@Param('id') id: string) {
    return this.animationsService.getStatus(id);
  }
}
