import { RedirectFSM, TRANSITIONS } from './state-machine';

describe('RedirectFSM', () => {
  it('transitions draft → pending_approval on submit', () => {
    const fsm = new RedirectFSM('draft');
    expect(fsm.canTransition('submit')).toBe(true);
    expect(fsm.transition('submit')).toBe('pending_approval');
  });

  it('transitions pending_approval → approved on approve', () => {
    const fsm = new RedirectFSM('pending_approval');
    expect(fsm.transition('approve')).toBe('approved');
  });

  it('transitions pending_approval → draft on reject', () => {
    const fsm = new RedirectFSM('pending_approval');
    expect(fsm.transition('reject')).toBe('draft');
  });

  it('transitions approved → deployed on deploy', () => {
    const fsm = new RedirectFSM('approved');
    expect(fsm.transition('deploy')).toBe('deployed');
  });

  it('transitions deployed → approved on rollback', () => {
    const fsm = new RedirectFSM('deployed');
    expect(fsm.transition('rollback')).toBe('approved');
  });

  it('transitions deployed → archived on archive', () => {
    const fsm = new RedirectFSM('deployed');
    expect(fsm.transition('archive')).toBe('archived');
  });

  it('throws on invalid transition from archived', () => {
    const fsm = new RedirectFSM('archived');
    expect(() => fsm.transition('submit')).toThrow();
  });

  it('canTransition returns false for invalid action', () => {
    const fsm = new RedirectFSM('draft');
    expect(fsm.canTransition('approve')).toBe(false);
  });
});
