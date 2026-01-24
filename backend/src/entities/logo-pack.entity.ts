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

export enum LogoPackStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface LogoSize {
  name: string; // e.g., "favicon-16", "ios-1024", "android-512"
  width: number;
  height: number;
  url: string; // CDN URL
}

@Entity('logo_packs')
export class LogoPack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  mascotId: string;

  @Column('uuid')
  createdById: string;

  @Column({ type: 'enum', enum: LogoPackStatus, default: LogoPackStatus.PENDING })
  status: LogoPackStatus;

  @Column({ type: 'jsonb', nullable: true })
  brandColors: string[]; // Hex color codes

  @Column({ type: 'jsonb' })
  sizes: LogoSize[]; // Array of logo sizes with URLs

  @Column({ type: 'text', nullable: true })
  zipFileUrl: string; // CDN URL for downloadable ZIP

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Mascot, (mascot) => mascot.logoPacks)
  @JoinColumn({ name: 'mascotId' })
  mascot: Mascot;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;
}
