import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { LifeStage } from '../../../entities/mascot.entity';

export class CreateEvolutionDto {
  @ApiProperty({ description: 'Parent mascot ID to evolve from' })
  @IsUUID()
  @IsNotEmpty()
  parentMascotId: string;

  @ApiProperty({
    enum: LifeStage,
    description: 'Target life stage for evolution',
  })
  @IsEnum(LifeStage)
  targetStage: LifeStage;
}

export class EvolutionChainResponseDto {
  @ApiProperty({ description: 'Root mascot ID' })
  rootMascotId: string;

  @ApiProperty({ description: 'Array of mascot IDs in evolution order' })
  evolutionChain: Array<{
    mascotId: string;
    stage: LifeStage;
    imageUrl: string | null;
  }>;
}
