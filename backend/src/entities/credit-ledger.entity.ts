import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Workspace } from './workspace.entity';

export enum CreditTransactionType {
  PURCHASE = 'purchase',
  SUBSCRIPTION_GRANT = 'subscription_grant',
  USAGE = 'usage',
  REFUND = 'refund',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

export enum CreditTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('credit_ledger')
export class CreditLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  userId: string;

  @Column('uuid', { nullable: true })
  workspaceId: string;

  @Column({ type: 'enum', enum: CreditTransactionType })
  type: CreditTransactionType;

  @Column({ type: 'int' })
  amount: number; // Positive for credits added, negative for credits used

  @Column({ type: 'int' })
  balanceAfter: number; // Balance after this transaction

  @Column({ type: 'enum', enum: CreditTransactionStatus, default: CreditTransactionStatus.PENDING })
  status: CreditTransactionStatus;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  referenceId: string; // Reference to job, subscription, etc.

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.creditTransactions, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Workspace, { nullable: true })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;
}
