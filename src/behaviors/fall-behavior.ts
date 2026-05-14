import { Behavior, BehaviorContext } from '../core/types';

const GRAVITY = 800;
const BOUNCE_DAMPING = 0.4;
const BOUNCE_THRESHOLD = 50;

export class FallBehavior implements Behavior {
  id = 'fall';
  priority = 10;

  private bounceCount = 0;

  enter(ctx: BehaviorContext): void {
    ctx.animation.play('fall');
    ctx.animation.setLoop(true);
    this.bounceCount = 0;
  }

  update(ctx: BehaviorContext, dt: number): void {
    const gravity = ctx.config?.get('fall.gravityPxPerSecondSquared', GRAVITY) ?? GRAVITY;
    const bounceDamping = ctx.config?.get('fall.bounceDamping', BOUNCE_DAMPING) ?? BOUNCE_DAMPING;
    const bounceThreshold =
      ctx.config?.get('fall.bounceThresholdPxPerSecond', BOUNCE_THRESHOLD) ?? BOUNCE_THRESHOLD;
    const dtSec = dt / 1000;
    ctx.velocity.y += gravity * dtSec;
    ctx.position.y += ctx.velocity.y * dtSec;
    ctx.position.x += ctx.velocity.x * dtSec;

    if (ctx.position.x < ctx.bounds.left) {
      ctx.position.x = ctx.bounds.left;
      ctx.velocity.x = Math.abs(ctx.velocity.x) * bounceDamping;
    } else if (ctx.position.x > ctx.bounds.right) {
      ctx.position.x = ctx.bounds.right;
      ctx.velocity.x = -Math.abs(ctx.velocity.x) * bounceDamping;
    }

    if (ctx.position.y >= ctx.bounds.groundY) {
      ctx.position.y = ctx.bounds.groundY;
      if (Math.abs(ctx.velocity.y) < bounceThreshold) {
        ctx.velocity.y = 0;
        ctx.velocity.x = 0;
        ctx.requestTransition('idle', 'fall-settled');
      } else {
        ctx.velocity.y = -Math.abs(ctx.velocity.y) * bounceDamping;
        ctx.velocity.x *= bounceDamping;
        this.bounceCount++;
      }
    }
  }

  exit(ctx: BehaviorContext): void {
    ctx.velocity.y = 0;
    this.bounceCount = 0;
  }

  canTransitionTo(nextId: string): boolean {
    return nextId === 'idle' || nextId === 'drag';
  }

  getBounceCount(): number {
    return this.bounceCount;
  }
}
