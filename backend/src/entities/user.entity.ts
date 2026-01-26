import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkspaceMember } from './workspace-member.entity';
import { CreditLedger } from './credit-ledger.entity';
import { Mascot } from './mascot.entity';

export enum UserPlan {
  FREE = 'free',
  CREATOR = 'creator',
  STUDIO = 'studio',
  AGENCY = 'agency',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan: UserPlan;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ type: 'jsonb', nullable: true })
  stripeSubscriptionMetadata: Record<string, any>;

  @Column({ default: 0 })
  creditBalance: number;

  @Column({ type: 'timestamp', nullable: true })
  creditsLastResetAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => WorkspaceMember, (member) => member.user)
  workspaceMemberships: WorkspaceMember[];

  @OneToMany(() => CreditLedger, (ledger) => ledger.user)
  creditTransactions: CreditLedger[];

  @OneToMany(() => Mascot, (mascot) => mascot.createdBy)
  mascots: Mascot[];
}
