import { Behavior, BehaviorContext } from '../core/types';

const WALK_SPEED = 80; // pixels per second
const WALK_MIN_DURATION = 2000;
const WALK_MAX_DURATION = 6000;

export class WalkBehavior implements Behavior {
  id = 'walk';
  priority = 1;

  private duration = 0;
  private targetDuration = 0;
  private direction = 1;

  enter(ctx: BehaviorContext): void {
    this.direction = Math.random() > 0.5 ? 1 : -1;
    ctx.velocity.x = WALK_SPEED * this.direction;
    ctx.velocity.y = 0;
    ctx.animation.play('walk');
    ctx.animation.setLoop(true);
    this.duration = 0;
    this.targetDuration = WALK_MIN_DURATION + Math.random() * (WALK_MAX_DURATION - WALK_MIN_DURATION);
  }

  update(ctx: BehaviorContext, dt: number): void {
    this.duration += dt;
    ctx.position.x += ctx.velocity.x * (dt / 1000);

    if (ctx.position.x <= ctx.bounds.left) {
      ctx.position.x = ctx.bounds.left;
      this.direction = 1;
      ctx.velocity.x = WALK_SPEED;
      ctx.eventBus.emit('edge:hit', { edge: 'left' });
    } else if (ctx.position.x >= ctx.bounds.right) {
      ctx.position.x = ctx.bounds.right;
      this.direction = -1;
      ctx.velocity.x = -WALK_SPEED;
      ctx.eventBus.emit('edge:hit', { edge: 'right' });
    }

    if (this.duration >= this.targetDuration) {
      ctx.requestTransition('idle', 'walk-timeout');
    }
  }

  exit(ctx: BehaviorContext): void {
    ctx.velocity.x = 0;
    this.duration = 0;
  }

  canTransitionTo(_nextId: string): boolean {
    return true;
  }
}
