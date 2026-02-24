import type { RedirectStatus } from '@linkrescue/types';

type Action = 'submit' | 'approve' | 'reject' | 'deploy' | 'rollback' | 'archive';

type TransitionMap = Partial<Record<Action, RedirectStatus>>;

export const TRANSITIONS: Record<RedirectStatus, TransitionMap> = {
  draft: {
    submit: 'pending_approval',
    archive: 'archived',
  },
  pending_approval: {
    approve: 'approved',
    reject: 'draft',
  },
  approved: {
    deploy: 'deployed',
    archive: 'archived',
  },
  deployed: {
    rollback: 'approved',
    archive: 'archived',
  },
  archived: {},
};

export class RedirectFSM {
  constructor(private status: RedirectStatus) {}

  canTransition(action: Action): boolean {
    return action in (TRANSITIONS[this.status] ?? {});
  }

  transition(action: Action): RedirectStatus {
    const next = TRANSITIONS[this.status]?.[action];
    if (!next) {
      throw new Error(`Invalid transition: ${action} from ${this.status}`);
    }
    this.status = next;
    return this.status;
  }

  getStatus(): RedirectStatus {
    return this.status;
  }
}
