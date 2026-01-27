import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pose, PoseStatus } from '../../entities/pose.entity';
import { CreatePoseDto } from './dto/create-pose.dto';
import { CreditsService } from '../credits/credits.service';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class PosesService {
  private readonly logger = new Logger(PosesService.name);

  constructor(
    @InjectRepository(Pose)
    private poseRepository: Repository<Pose>,
    private creditsService: CreditsService,
    private jobsService: JobsService,
  ) {}

  async create(mascotId: string, dto: CreatePoseDto, userId: string) {
    // Check credits (1 credit per pose)
    const hasCredits = await this.creditsService.checkAndReserveCredits(userId, 1);
    if (!hasCredits) {
      throw new Error('Insufficient credits');
    }

    const pose = this.poseRepository.create({
      mascotId,
      createdById: userId,
      prompt: dto.prompt,
      figmaFileId: dto.figmaFileId,
      status: PoseStatus.PENDING,
    });

    const saved = await this.poseRepository.save(pose);
    
    // Enqueue job for pose generation
    await this.jobsService.enqueuePoseGeneration(saved.id, mascotId, dto);

    this.logger.log(`Created pose ${saved.id} for mascot ${mascotId} with prompt: "${dto.prompt}"`);
    
    return saved;
  }

  async findByMascot(mascotId: string): Promise<Pose[]> {
    return this.poseRepository.find({
      where: { mascotId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Pose | null> {
    return this.poseRepository.findOne({ where: { id } });
  }

  async getStatus(id: string) {
    const pose = await this.findOne(id);
    if (!pose) {
      throw new Error('Pose not found');
    }
    return {
      id: pose.id,
      status: pose.status,
      errorMessage: pose.errorMessage,
    };
  }
}
