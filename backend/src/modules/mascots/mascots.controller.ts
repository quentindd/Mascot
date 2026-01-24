import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MascotsService } from './mascots.service';
import { CreateMascotDto, MascotResponseDto } from './dto/create-mascot.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('mascots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mascots')
export class MascotsController {
  constructor(private readonly mascotsService: MascotsService) {}

  @Post()
  @ApiOperation({ summary: 'Generate a new mascot' })
  async create(
    @Body() createMascotDto: CreateMascotDto,
    @Request() req,
  ): Promise<MascotResponseDto> {
    return this.mascotsService.create(createMascotDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all mascots' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('workspaceId') workspaceId?: string,
    @Query('figmaFileId') figmaFileId?: string,
    @Request() req?,
  ) {
    return this.mascotsService.findAll(
      req.user.id,
      pagination,
      workspaceId,
      figmaFileId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific mascot' })
  async findOne(@Param('id') id: string): Promise<MascotResponseDto> {
    return this.mascotsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a mascot' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.mascotsService.remove(id, req.user.id);
  }
}
