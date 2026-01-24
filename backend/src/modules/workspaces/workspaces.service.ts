import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../../entities/workspace.entity';
import { WorkspaceMember, WorkspaceRole } from '../../entities/workspace-member.entity';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private memberRepository: Repository<WorkspaceMember>,
  ) {}

  async findUserWorkspaces(userId: string) {
    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: ['workspace'],
    });

    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
      creditBalance: m.workspace.creditBalance,
    }));
  }

  async create(name: string, ownerId: string) {
    const workspace = this.workspaceRepository.create({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
    });

    const saved = await this.workspaceRepository.save(workspace);

    // Add creator as owner
    const membership = this.memberRepository.create({
      userId: ownerId,
      workspaceId: saved.id,
      role: WorkspaceRole.OWNER,
    });

    await this.memberRepository.save(membership);

    return saved;
  }
}
