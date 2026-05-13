import { Behavior, BehaviorContext } from '../core/types';

export class DragBehavior implements Behavior {
  id = 'drag';
  priority = 100;

  private lastX = 0;
  private lastY = 0;
  private lastTime = 0;

  enter(ctx: BehaviorContext): void {
    ctx.velocity.x = 0;
    ctx.velocity.y = 0;
    ctx.animation.play('drag');
    ctx.animation.setLoop(true);
    this.lastX = ctx.position.x;
    this.lastY = ctx.position.y;
    this.lastTime = Date.now();

    ctx.eventBus.on('mouse:move', this.handleMouseMove.bind(this, ctx));
    ctx.eventBus.on('mouse:up', this.handleMouseUp.bind(this, ctx));
  }

  update(_ctx: BehaviorContext, _dt: number): void {
    // Position is updated via mouse:move events
  }

  exit(ctx: BehaviorContext): void {
    ctx.eventBus.off('mouse:move', this.handleMouseMove.bind(this, ctx));
    ctx.eventBus.off('mouse:up', this.handleMouseUp.bind(this, ctx));
  }

  canTransitionTo(nextId: string): boolean {
    return nextId === 'fall';
  }

  private handleMouseMove(ctx: BehaviorContext, payload: { x: number; y: number }): void {
    const now = Date.now();
    const dt = Math.max(1, now - this.lastTime);
    ctx.velocity.x = ((payload.x - this.lastX) / dt) * 1000;
    ctx.velocity.y = ((payload.y - this.lastY) / dt) * 1000;
    this.lastX = ctx.position.x;
    this.lastY = ctx.position.y;
    this.lastTime = now;
    ctx.position.x = payload.x;
    ctx.position.y = payload.y;
  }

  private handleMouseUp(ctx: BehaviorContext, _payload: { x: number; y: number; velocityX: number; velocityY: number }): void {
    ctx.requestTransition('fall', 'drag-release');
  }
}
