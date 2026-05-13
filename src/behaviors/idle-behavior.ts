import { Behavior, BehaviorContext } from '../core/types';

const IDLE_MIN_DURATION = 3000;
const IDLE_MAX_DURATION = 8000;

export class IdleBehavior implements Behavior {
  id = 'idle';
  priority = 0;

  private duration = 0;
  private targetDuration = 0;

  enter(ctx: BehaviorContext): void {
    ctx.velocity.x = 0;
    ctx.velocity.y = 0;
    ctx.animation.play('idle');
    ctx.animation.setLoop(true);
    this.duration = 0;
    this.targetDuration = IDLE_MIN_DURATION + Math.random() * (IDLE_MAX_DURATION - IDLE_MIN_DURATION);
  }

  update(ctx: BehaviorContext, dt: number): void {
    this.duration += dt;
    if (this.duration >= this.targetDuration) {
      ctx.requestTransition('walk', 'idle-timeout');
    }
  }

  exit(_ctx: BehaviorContext): void {
    this.duration = 0;
  }

  canTransitionTo(_nextId: string): boolean {
    return true;
  }
}
