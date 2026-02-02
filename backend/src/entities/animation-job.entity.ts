import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Mascot } from './mascot.entity';
import { User } from './user.entity';

export enum AnimationAction {
  WALK = 'walk',
  WAVE = 'wave',
  JUMP = 'jump',
  DANCE = 'dance',
  IDLE = 'idle',
  RUN = 'run',
  CELEBRATE = 'celebrate',
  THINK = 'think',
  SLEEP = 'sleep',
  SAD = 'sad',
  EXERCISE = 'exercise',
  BACKFLIP = 'backflip',
  CUSTOM = 'custom', // For custom actions
}

export enum AnimationStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum AnimationFormat {
  SPRITE_SHEET = 'sprite_sheet',
  VIDEO_WEBM = 'video_webm',
  VIDEO_MOV = 'video_mov',
  LOTTIE = 'lottie',
}

@Entity('animation_jobs')
export class AnimationJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  mascotId: string;

  @Column('uuid')
  createdById: string;

  @Column({ type: 'enum', enum: AnimationAction })
  action: AnimationAction;

  @Column({ type: 'text', nullable: true })
  customAction: string; // Free-form custom action when action = CUSTOM (e.g., "playing guitar", "doing a backflip")

  @Column({ type: 'enum', enum: AnimationStatus, default: AnimationStatus.PENDING })
  status: AnimationStatus;

  @Column({ type: 'int', default: 360 })
  resolution: number; // 128, 240, 360, 480, 720

  // Output URLs
  @Column({ type: 'text', nullable: true })
  spriteSheetUrl: string; // CDN URL

  @Column({ type: 'text', nullable: true })
  webmVideoUrl: string; // CDN URL (VP9 with alpha)

  @Column({ type: 'text', nullable: true })
  movVideoUrl: string; // CDN URL (MP4 from Veo, opaque)

  @Column({ type: 'text', nullable: true })
  movAlphaUrl: string; // CDN URL (HEVC .mov with alpha, for Safari/iOS)

  @Column({ type: 'text', nullable: true })
  lottieUrl: string; // CDN URL

  @Column({ type: 'int', nullable: true })
  frameCount: number;

  @Column({ type: 'int', nullable: true })
  durationMs: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Generation params, model info, etc.

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Mascot, (mascot) => mascot.animations)
  @JoinColumn({ name: 'mascotId' })
  mascot: Mascot;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;
}
