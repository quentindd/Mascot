import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mascot, MascotStatus } from '../../entities/mascot.entity';
import { CreateMascotDto, MascotResponseDto } from './dto/create-mascot.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { CreditsService } from '../credits/credits.service';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class MascotsService {
  constructor(
    @InjectRepository(Mascot)
    private mascotRepository: Repository<Mascot>,
    private creditsService: CreditsService,
    private jobsService: JobsService,
  ) {}

  async create(createMascotDto: CreateMascotDto, userId: string): Promise<MascotResponseDto[]> {
    // Check credits (1 credit generates up to 3 variations)
    const hasCredits = await this.creditsService.checkAndReserveCredits(
      userId,
      1, // 1 credit for batch of variations
    );

    if (!hasCredits) {
      throw new ForbiddenException('Insufficient credits');
    }

    const numVariations = createMascotDto.numVariations || 3;
    const batchId = this.generateBatchId();

    // Create multiple mascot records (one for each variation)
    const mascots: Mascot[] = [];
    for (let i = 1; i <= numVariations; i++) {
      // Support both old format (prompt) and new format (mascotDetails) like MascotAI
      const mascotDetails = createMascotDto.mascotDetails || createMascotDto.prompt;
      const bodyParts = createMascotDto.bodyParts || createMascotDto.accessories || [];
      const brandName = createMascotDto.brandName || createMascotDto.name;

      const mascot = this.mascotRepository.create({
        name: brandName,
        prompt: mascotDetails, // Store mascotDetails in prompt field for compatibility
        style: createMascotDto.style,
        type: createMascotDto.type || 'auto' as any,
        personality: createMascotDto.personality || 'friendly' as any,
        negativePrompt: createMascotDto.negativePrompt,
        accessories: bodyParts, // Store bodyParts in accessories field
        brandColors: createMascotDto.brandColors,
        advancedMode: createMascotDto.advancedMode || false,
        autoFillUrl: createMascotDto.autoFillUrl,
        referenceImageUrl: createMascotDto.referenceImageUrl,
        variationIndex: i,
        batchId: batchId,
        createdById: userId,
        status: MascotStatus.PENDING,
        figmaFileIds: createMascotDto.figmaFileId ? [createMascotDto.figmaFileId] : [],
      });

      mascots.push(mascot);
    }

    const savedMascots = await this.mascotRepository.save(mascots);

    // Enqueue generation jobs for all variations
    for (const mascot of savedMascots) {
      await this.jobsService.enqueueMascotGeneration(mascot.id, {
        ...createMascotDto,
        // Ensure MascotAI-compatible fields are passed
        mascotDetails: createMascotDto.mascotDetails || createMascotDto.prompt,
        bodyParts: createMascotDto.bodyParts || createMascotDto.accessories || [],
        brandName: createMascotDto.brandName || createMascotDto.name,
        color: createMascotDto.color,
        appDescription: createMascotDto.appDescription,
        aspectRatio: createMascotDto.aspectRatio || '1:1',
        variationIndex: mascot.variationIndex,
        batchId: mascot.batchId,
      });
    }

    return savedMascots.map((m) => this.toResponseDto(m));
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  async findAll(
    userId: string,
    pagination: PaginationDto,
    workspaceId?: string,
    figmaFileId?: string,
  ): Promise<PaginatedResponse<MascotResponseDto>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const query = this.mascotRepository
      .createQueryBuilder('mascot')
      .where('mascot.createdById = :userId', { userId });

    if (workspaceId) {
      query.andWhere('mascot.workspaceId = :workspaceId', { workspaceId });
    }

    if (figmaFileId) {
      query.andWhere("mascot.figmaFileIds @> :figmaFileId", {
        figmaFileId: JSON.stringify([figmaFileId]),
      });
    }

    const [data, total] = await query
      .orderBy('mascot.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((m) => this.toResponseDto(m)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<MascotResponseDto> {
    const mascot = await this.mascotRepository.findOne({ where: { id } });
    if (!mascot) {
      throw new NotFoundException(`Mascot with ID ${id} not found`);
    }
    return this.toResponseDto(mascot);
  }

  async remove(id: string, userId: string): Promise<void> {
    const mascot = await this.mascotRepository.findOne({
      where: { id, createdById: userId },
    });

    if (!mascot) {
      throw new NotFoundException(`Mascot with ID ${id} not found`);
    }

    await this.mascotRepository.remove(mascot);
  }

  /**
   * Create an evolved version of a mascot (life stage progression)
   */
  async evolve(parentMascotId: string, targetStage: any, userId: string): Promise<MascotResponseDto> {
    // Check credits
    const hasCredits = await this.creditsService.checkAndReserveCredits(userId, 1);
    if (!hasCredits) {
      throw new ForbiddenException('Insufficient credits');
    }

    // Get parent mascot
    const parentMascot = await this.mascotRepository.findOne({
      where: { id: parentMascotId, createdById: userId },
    });

    if (!parentMascot) {
      throw new NotFoundException(`Parent mascot with ID ${parentMascotId} not found`);
    }

    // Create evolved mascot
    const evolvedMascot = this.mascotRepository.create({
      ...parentMascot,
      id: undefined, // Generate new ID
      parentMascotId: parentMascotId,
      lifeStage: targetStage,
      characterId: parentMascot.characterId || parentMascot.id, // Maintain character consistency
      status: 'pending' as any,
      fullBodyImageUrl: null,
      avatarImageUrl: null,
      squareIconUrl: null,
      createdAt: undefined,
      updatedAt: undefined,
    });

    const saved = await this.mascotRepository.save(evolvedMascot);

    // Enqueue generation job
    await this.jobsService.enqueueMascotGeneration(saved.id, {
      name: saved.name,
      prompt: saved.prompt,
      style: saved.style,
      parentMascotId: parentMascotId,
      lifeStage: targetStage,
    });

    return this.toResponseDto(saved);
  }

  /**
   * Get evolution chain for a mascot
   */
  async getEvolutionChain(mascotId: string, userId: string): Promise<any> {
    const mascot = await this.mascotRepository.findOne({
      where: { id: mascotId, createdById: userId },
      relations: ['parentMascot', 'childMascots'],
    });

    if (!mascot) {
      throw new NotFoundException(`Mascot with ID ${mascotId} not found`);
    }

    // Find root mascot
    let root = mascot;
    while (root.parentMascot) {
      root = root.parentMascot;
    }

    // Build evolution chain
    const chain = await this.buildEvolutionChain(root);

    return {
      rootMascotId: root.id,
      evolutionChain: chain,
    };
  }

  private async buildEvolutionChain(mascot: Mascot): Promise<any[]> {
    const result = [
      {
        mascotId: mascot.id,
        stage: mascot.lifeStage || 'adult',
        imageUrl: mascot.fullBodyImageUrl,
      },
    ];

    // Load children if not already loaded
    const mascotWithChildren = await this.mascotRepository.findOne({
      where: { id: mascot.id },
      relations: ['childMascots'],
    });

    if (mascotWithChildren && mascotWithChildren.childMascots) {
      for (const child of mascotWithChildren.childMascots) {
        const childChain = await this.buildEvolutionChain(child);
        result.push(...childChain);
      }
    }

    return result;
  }

  /**
   * Get all variations in a batch
   */
  async getBatchVariations(batchId: string, userId: string): Promise<MascotResponseDto[]> {
    const mascots = await this.mascotRepository.find({
      where: { batchId, createdById: userId },
      order: { variationIndex: 'ASC' },
    });

    return mascots.map((m) => this.toResponseDto(m));
  }

  private toResponseDto(mascot: Mascot): MascotResponseDto {
    return {
      id: mascot.id,
      name: mascot.name,
      prompt: mascot.prompt,
      style: mascot.style,
      type: mascot.type,
      personality: mascot.personality,
      negativePrompt: mascot.negativePrompt,
      accessories: mascot.accessories,
      brandColors: mascot.brandColors,
      advancedMode: mascot.advancedMode,
      autoFillUrl: mascot.autoFillUrl,
      lifeStage: mascot.lifeStage,
      parentMascotId: mascot.parentMascotId,
      variationIndex: mascot.variationIndex,
      batchId: mascot.batchId,
      characterId: mascot.characterId,
      status: mascot.status,
      fullBodyImageUrl: mascot.fullBodyImageUrl,
      avatarImageUrl: mascot.avatarImageUrl,
      squareIconUrl: mascot.squareIconUrl,
      referenceImageUrl: mascot.referenceImageUrl,
      createdAt: mascot.createdAt,
      updatedAt: mascot.updatedAt,
    };
  }
}
