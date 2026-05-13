import { Behavior, BehaviorContext } from '../core/types';

const JUMP_VELOCITY_Y = -400; // pixels per second (upward)
const GRAVITY = 800; // pixels per second^2

export class JumpBehavior implements Behavior {
  id = 'jump';
  priority = 2;

  private grounded = false;

  enter(ctx: BehaviorContext): void {
    ctx.velocity.y = JUMP_VELOCITY_Y;
    ctx.animation.play('jump');
    ctx.animation.setLoop(false);
    this.grounded = false;
  }

  update(ctx: BehaviorContext, dt: number): void {
    const dtSec = dt / 1000;
    ctx.velocity.y += GRAVITY * dtSec;
    ctx.position.y += ctx.velocity.y * dtSec;
    ctx.position.x += ctx.velocity.x * dtSec;

    if (ctx.position.x < ctx.bounds.left) {
      ctx.position.x = ctx.bounds.left;
      ctx.velocity.x = 0;
    } else if (ctx.position.x > ctx.bounds.right) {
      ctx.position.x = ctx.bounds.right;
      ctx.velocity.x = 0;
    }

    if (ctx.position.y >= ctx.bounds.groundY) {
      ctx.position.y = ctx.bounds.groundY;
      ctx.velocity.y = 0;
      this.grounded = true;
      ctx.requestTransition('idle', 'jump-landed');
    }
  }

  exit(ctx: BehaviorContext): void {
    ctx.velocity.y = 0;
    this.grounded = false;
  }

  canTransitionTo(nextId: string): boolean {
    if (this.grounded) return true;
    return nextId === 'drag';
  }
}
