import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
  async findByMascot(@Param('id') mascotId: string) {
    const logoPacks = await this.logosService.findByMascot(mascotId);
    return { data: logoPacks };
  }

  @Get('logo-packs/:id')
  findOne(@Param('id') id: string) {
    return this.logosService.findOne(id);
  }

  @Delete('logo-packs/:id')
  @ApiOperation({ summary: 'Delete a logo pack' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.logosService.remove(id, req.user.id);
    return { message: 'Logo pack deleted successfully' };
  }
}
