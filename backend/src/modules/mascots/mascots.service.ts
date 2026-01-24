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

  async create(createMascotDto: CreateMascotDto, userId: string): Promise<MascotResponseDto> {
    // Check credits
    const hasCredits = await this.creditsService.checkAndReserveCredits(
      userId,
      1, // 1 credit for mascot
    );

    if (!hasCredits) {
      throw new ForbiddenException('Insufficient credits');
    }

    // Create mascot record
    const mascot = this.mascotRepository.create({
      ...createMascotDto,
      createdById: userId,
      status: MascotStatus.PENDING,
    });

    const saved = await this.mascotRepository.save(mascot);

    // Enqueue generation job
    await this.jobsService.enqueueMascotGeneration(saved.id, createMascotDto);

    return this.toResponseDto(saved);
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

  private toResponseDto(mascot: Mascot): MascotResponseDto {
    return {
      id: mascot.id,
      name: mascot.name,
      prompt: mascot.prompt,
      style: mascot.style,
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
