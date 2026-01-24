import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum JobType {
  MASCOT_GENERATION = 'mascot_generation',
  ANIMATION_GENERATION = 'animation_generation',
  LOGO_PACK_GENERATION = 'logo_pack_generation',
}

export enum JobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('generation_jobs')
export class GenerationJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: JobType })
  type: JobType;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.QUEUED })
  status: JobStatus;

  @Column('uuid', { nullable: true })
  userId: string;

  @Column('uuid', { nullable: true })
  workspaceId: string;

  @Column('uuid', { nullable: true })
  referenceId: string; // Mascot ID, AnimationJob ID, or LogoPack ID

  @Column({ type: 'jsonb' })
  input: Record<string, any>; // Job input parameters

  @Column({ type: 'jsonb', nullable: true })
  output: Record<string, any>; // Job output results

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Model info, duration, etc.

  @Column({ type: 'int', nullable: true })
  creditsDeducted: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
