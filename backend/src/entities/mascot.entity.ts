import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Workspace } from './workspace.entity';
import { AnimationJob } from './animation-job.entity';
import { LogoPack } from './logo-pack.entity';

export enum MascotStyle {
  KAWAII = 'kawaii',
  CARTOON = 'cartoon',
  FLAT = 'flat',
  PIXEL = 'pixel',
  THREE_D = '3d',
  MATCH_BRAND = 'match_brand',
}

export enum MascotStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('mascots')
export class Mascot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  createdById: string;

  @Column('uuid', { nullable: true })
  workspaceId: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'enum', enum: MascotStyle })
  style: MascotStyle;

  @Column({ nullable: true })
  characterId: string; // Stable character ID for consistency

  @Column({ nullable: true })
  seed: number; // Seed used for generation

  @Column({ type: 'text', nullable: true })
  embeddingId: string; // LoRA/embedding ID for character consistency

  @Column({ type: 'enum', enum: MascotStatus, default: MascotStatus.PENDING })
  status: MascotStatus;

  // Generated images
  @Column({ type: 'text', nullable: true })
  fullBodyImageUrl: string; // CDN URL

  @Column({ type: 'text', nullable: true })
  avatarImageUrl: string; // CDN URL

  @Column({ type: 'text', nullable: true })
  squareIconUrl: string; // CDN URL

  // Reference image for brand matching
  @Column({ type: 'text', nullable: true })
  referenceImageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Generation params, model info, etc.

  @Column({ type: 'jsonb', nullable: true })
  figmaFileIds: string[]; // Figma file IDs where this mascot is used

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.mascots)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ManyToOne(() => Workspace, (workspace) => workspace.mascots, { nullable: true })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @OneToMany(() => AnimationJob, (job) => job.mascot)
  animations: AnimationJob[];

  @OneToMany(() => LogoPack, (pack) => pack.mascot)
  logoPacks: LogoPack[];
}
