import { Behavior, BehaviorContext } from '../core/types';

const PETTING_DURATION = 900;

export class PettingBehavior implements Behavior {
  id = 'petting';
  priority = 50;

  private duration = 0;

  constructor(private getReturnBehaviorId: () => string) {}

  enter(ctx: BehaviorContext): void {
    ctx.velocity.x = 0;
    ctx.velocity.y = 0;
    ctx.animation.play('happy');
    ctx.animation.setLoop(false);
    this.duration = 0;
  }

  update(ctx: BehaviorContext, dt: number): void {
    this.duration += dt;
    const duration = ctx.config?.get('petting.durationMs', PETTING_DURATION) ?? PETTING_DURATION;
    if (this.duration >= duration) {
      ctx.requestTransition(this.getReturnBehaviorId(), 'petting-complete');
    }
  }

  exit(_ctx: BehaviorContext): void {
    this.duration = 0;
  }

  canTransitionTo(nextId: string): boolean {
    return nextId === this.getReturnBehaviorId() || nextId === 'drag' || nextId === 'jump';
  }
}
