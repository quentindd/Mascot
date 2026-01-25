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
  MINIMAL = 'minimal',
  THREE_D_PIXAR = '3d_pixar',
  HAND_DRAWN = 'hand_drawn',
  MATCH_BRAND = 'match_brand',
}

export enum MascotType {
  AUTO = 'auto',
  ANIMAL = 'animal',
  CREATURE = 'creature',
  ROBOT = 'robot',
  FOOD = 'food',
  OBJECT = 'object',
  ABSTRACT = 'abstract',
}

export enum MascotPersonality {
  FRIENDLY = 'friendly',
  PROFESSIONAL = 'professional',
  PLAYFUL = 'playful',
  COOL = 'cool',
  ENERGETIC = 'energetic',
  CALM = 'calm',
}

export enum MascotStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum LifeStage {
  BABY = 'baby',
  CHILD = 'child',
  TEEN = 'teen',
  ADULT = 'adult',
  ELDER = 'elder',
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

  @Column({ type: 'enum', enum: MascotType, default: MascotType.AUTO })
  type: MascotType;

  @Column({ type: 'enum', enum: MascotPersonality, default: MascotPersonality.FRIENDLY })
  personality: MascotPersonality;

  @Column({ type: 'text', nullable: true })
  negativePrompt: string; // Elements to exclude

  @Column({ type: 'jsonb', nullable: true })
  accessories: string[]; // Array of accessory names (wings, cape, glasses, etc.)

  @Column({ type: 'jsonb', nullable: true })
  brandColors: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };

  @Column({ type: 'boolean', default: false })
  advancedMode: boolean; // If true, use raw custom prompt

  @Column({ type: 'text', nullable: true })
  autoFillUrl: string; // Original URL used for auto-fill

  @Column({ type: 'enum', enum: LifeStage, nullable: true })
  lifeStage: LifeStage;

  @Column({ type: 'uuid', nullable: true })
  parentMascotId: string; // For evolution chains

  @Column({ type: 'int', default: 1 })
  variationIndex: number; // Which variation (1-4) this is

  @Column({ type: 'text', nullable: true })
  batchId: string; // Groups 4 variations together

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

  @ManyToOne(() => Mascot, (mascot) => mascot.childMascots, { nullable: true })
  @JoinColumn({ name: 'parentMascotId' })
  parentMascot: Mascot;

  @OneToMany(() => Mascot, (mascot) => mascot.parentMascot)
  childMascots: Mascot[];

  @OneToMany(() => AnimationJob, (job) => job.mascot)
  animations: AnimationJob[];

  @OneToMany(() => LogoPack, (pack) => pack.mascot)
  logoPacks: LogoPack[];
}
