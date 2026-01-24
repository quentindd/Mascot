import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogoPack, LogoPackStatus } from '../../entities/logo-pack.entity';
import { CreateLogoPackDto } from './dto/create-logo-pack.dto';
import { CreditsService } from '../credits/credits.service';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class LogosService {
  constructor(
    @InjectRepository(LogoPack)
    private logoPackRepository: Repository<LogoPack>,
    private creditsService: CreditsService,
    private jobsService: JobsService,
  ) {}

  async create(mascotId: string, dto: CreateLogoPackDto, userId: string) {
    const hasCredits = await this.creditsService.checkAndReserveCredits(userId, 20);
    if (!hasCredits) {
      throw new Error('Insufficient credits');
    }

    const logoPack = this.logoPackRepository.create({
      mascotId,
      createdById: userId,
      brandColors: dto.brandColors,
      status: LogoPackStatus.PENDING,
      sizes: [],
    });

    const saved = await this.logoPackRepository.save(logoPack);
    await this.jobsService.enqueueLogoPackGeneration(saved.id, mascotId, dto);

    return saved;
  }

  async findByMascot(mascotId: string) {
    return this.logoPackRepository.find({ where: { mascotId } });
  }

  async findOne(id: string) {
    return this.logoPackRepository.findOne({ where: { id } });
  }
}
