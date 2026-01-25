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
import { AutoFillRequestDto, AutoFillResponseDto } from './dto/auto-fill.dto';
import { CreateEvolutionDto, EvolutionChainResponseDto } from './dto/evolution.dto';
import { ExportFormatsResponseDto } from './dto/code-snippet.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AutoFillService } from './auto-fill.service';
import { CodeSnippetService } from './code-snippet.service';

@ApiTags('mascots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mascots')
export class MascotsController {
  constructor(
    private readonly mascotsService: MascotsService,
    private readonly autoFillService: AutoFillService,
    private readonly codeSnippetService: CodeSnippetService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Generate a new mascot (returns 1-3 variations)' })
  async create(
    @Body() createMascotDto: CreateMascotDto,
    @Request() req,
  ): Promise<MascotResponseDto[]> {
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

  @Post('auto-fill')
  @ApiOperation({ summary: 'Extract mascot info from App Store/Play Store/Website URL' })
  async autoFill(
    @Body() autoFillDto: AutoFillRequestDto,
  ): Promise<AutoFillResponseDto> {
    const extracted = await this.autoFillService.extractFromUrl(autoFillDto.url);
    return this.autoFillService.enhanceWithAI(extracted);
  }

  @Get('batch/:batchId')
  @ApiOperation({ summary: 'Get all variations in a batch' })
  async getBatchVariations(
    @Param('batchId') batchId: string,
    @Request() req,
  ): Promise<MascotResponseDto[]> {
    return this.mascotsService.getBatchVariations(batchId, req.user.id);
  }

  @Post(':id/evolve')
  @ApiOperation({ summary: 'Evolve a mascot to a new life stage' })
  async evolve(
    @Param('id') id: string,
    @Body() evolutionDto: CreateEvolutionDto,
    @Request() req,
  ): Promise<MascotResponseDto> {
    return this.mascotsService.evolve(id, evolutionDto.targetStage, req.user.id);
  }

  @Get(':id/evolution-chain')
  @ApiOperation({ summary: 'Get evolution chain for a mascot' })
  async getEvolutionChain(
    @Param('id') id: string,
    @Request() req,
  ): Promise<EvolutionChainResponseDto> {
    return this.mascotsService.getEvolutionChain(id, req.user.id);
  }

  @Get(':id/export-formats')
  @ApiOperation({ summary: 'Get export formats and code snippets for a mascot' })
  async getExportFormats(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ExportFormatsResponseDto> {
    const mascot = await this.mascotsService.findOne(id);
    return this.codeSnippetService.getExportFormats(
      null, // webmUrl (from animation)
      null, // movUrl (from animation)
      mascot.fullBodyImageUrl,
    );
  }
}
