import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MascotsController } from './mascots.controller';
import { MascotsService } from './mascots.service';
import { Mascot } from '../../entities/mascot.entity';
import { GenerationJob } from '../../entities/generation-job.entity';
import { CreditsModule } from '../credits/credits.module';
import { StorageModule } from '../storage/storage.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mascot, GenerationJob]),
    CreditsModule,
    StorageModule,
    JobsModule,
  ],
  controllers: [MascotsController],
  providers: [MascotsService],
  exports: [MascotsService],
})
export class MascotsModule {}
