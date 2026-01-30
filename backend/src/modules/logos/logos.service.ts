import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogoPack, LogoPackStatus } from '../../entities/logo-pack.entity';
import { CreateLogoPackDto } from './dto/create-logo-pack.dto';
import { CreditsService } from '../credits/credits.service';
import { JobsService } from '../jobs/jobs.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class LogosService {
  constructor(
    @InjectRepository(LogoPack)
    private logoPackRepository: Repository<LogoPack>,
    private creditsService: CreditsService,
    private jobsService: JobsService,
    private storageService: StorageService,
  ) {}

  async create(mascotId: string, dto: CreateLogoPackDto, userId: string) {
    // Logo packs are free (no credit check). Re-enable: checkAndReserveCredits(userId, 20) then throw if !hasCredits

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
    return this.logoPackRepository.find({
      where: { mascotId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.logoPackRepository.findOne({ where: { id } });
  }

  async remove(id: string, userId: string): Promise<void> {
    const logoPack = await this.logoPackRepository.findOne({
      where: { id, createdById: userId },
    });

    if (!logoPack) {
      throw new NotFoundException(`Logo pack with ID ${id} not found`);
    }

    // Delete associated files from storage
    const urlsToDelete: (string | null | undefined)[] = [logoPack.zipFileUrl];
    
    // Add all logo size URLs
    if (logoPack.sizes && Array.isArray(logoPack.sizes)) {
      logoPack.sizes.forEach((size) => {
        if (size.url) {
          urlsToDelete.push(size.url);
        }
      });
    }

    await this.storageService.deleteFilesByUrls(urlsToDelete);
    await this.logoPackRepository.remove(logoPack);
  }
}
