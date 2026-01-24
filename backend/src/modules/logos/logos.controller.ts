import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LogosService } from './logos.service';
import { CreateLogoPackDto } from './dto/create-logo-pack.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('logos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class LogosController {
  constructor(private readonly logosService: LogosService) {}

  @Post('mascots/:id/logo-packs')
  create(@Param('id') mascotId: string, @Body() dto: CreateLogoPackDto, @Request() req) {
    return this.logosService.create(mascotId, dto, req.user.id);
  }

  @Get('mascots/:id/logo-packs')
  findByMascot(@Param('id') mascotId: string) {
    return this.logosService.findByMascot(mascotId);
  }

  @Get('logo-packs/:id')
  findOne(@Param('id') id: string) {
    return this.logosService.findOne(id);
  }
}
