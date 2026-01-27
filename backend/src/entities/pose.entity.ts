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

export enum PoseStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('poses')
export class Pose {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  createdById: string;

  @Column('uuid')
  mascotId: string;

  @ManyToOne(() => Mascot)
  @JoinColumn({ name: 'mascotId' })
  mascot: Mascot;

  @Column({ type: 'text' })
  prompt: string; // Custom prompt describing the pose/action

  @Column({ type: 'enum', enum: PoseStatus, default: PoseStatus.PENDING })
  status: PoseStatus;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null; // Full body image URL

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'text', nullable: true })
  figmaFileId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
