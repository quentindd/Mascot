import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnimationJob, AnimationStatus } from '../../entities/animation-job.entity';
import { CreateAnimationDto } from './dto/create-animation.dto';
import { CreditsService } from '../credits/credits.service';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class AnimationsService {
  constructor(
    @InjectRepository(AnimationJob)
    private animationRepository: Repository<AnimationJob>,
    private creditsService: CreditsService,
    private jobsService: JobsService,
  ) {}

  async create(mascotId: string, dto: CreateAnimationDto, userId: string) {
    const hasCredits = await this.creditsService.checkAndReserveCredits(userId, 25);
    if (!hasCredits) {
      throw new Error('Insufficient credits');
    }

    const animation = this.animationRepository.create({
      mascotId,
      createdById: userId,
      action: dto.action,
      customAction: dto.customAction,
      resolution: dto.resolution || 360,
      status: AnimationStatus.PENDING,
    });

    const saved = await this.animationRepository.save(animation);
    await this.jobsService.enqueueAnimationGeneration(saved.id, mascotId, dto);

    return saved;
  }

  async generateDefault(mascotId: string, dto: any, userId: string) {
    // Generate multiple animations at once
    const actions = ['wave', 'celebrate', 'think', 'sleep', 'idle'];
    // Implementation would create multiple jobs
    return { jobs: [], totalCreditsUsed: actions.length * 25 };
  }

  async findByMascot(mascotId: string) {
    return this.animationRepository.find({ where: { mascotId } });
  }

  async findOne(id: string) {
    return this.animationRepository.findOne({ where: { id } });
  }

  async getStatus(id: string) {
    const animation = await this.findOne(id);
    return {
      id: animation.id,
      status: animation.status,
      errorMessage: animation.errorMessage,
    };
  }
}
