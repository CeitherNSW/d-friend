import { Behavior, BehaviorContext } from '../core/types';

export class DragBehavior implements Behavior {
  id = 'drag';
  priority = 100;

  private lastX = 0;
  private lastY = 0;
  private lastTime = 0;
  private mouseMoveHandler: ((payload: { x: number; y: number }) => void) | null = null;
  private mouseUpHandler:
    | ((payload: { x: number; y: number; velocityX: number; velocityY: number }) => void)
    | null = null;

  enter(ctx: BehaviorContext): void {
    ctx.velocity.x = 0;
    ctx.velocity.y = 0;
    ctx.animation.play('drag');
    ctx.animation.setLoop(true);
    this.lastX = ctx.position.x;
    this.lastY = ctx.position.y;
    this.lastTime = Date.now();
    this.mouseMoveHandler = (payload) => this.handleMouseMove(ctx, payload);
    this.mouseUpHandler = (payload) => this.handleMouseUp(ctx, payload);

    ctx.eventBus.on('mouse:move', this.mouseMoveHandler);
    ctx.eventBus.on('mouse:up', this.mouseUpHandler);
  }

  update(_ctx: BehaviorContext, _dt: number): void {
    // Position is updated via mouse:move events
  }

  exit(ctx: BehaviorContext): void {
    if (this.mouseMoveHandler) {
      ctx.eventBus.off('mouse:move', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
    if (this.mouseUpHandler) {
      ctx.eventBus.off('mouse:up', this.mouseUpHandler);
      this.mouseUpHandler = null;
    }
  }

  canTransitionTo(nextId: string): boolean {
    return nextId === 'fall';
  }

  private handleMouseMove(ctx: BehaviorContext, payload: { x: number; y: number }): void {
    const now = Date.now();
    const dt = Math.max(1, now - this.lastTime);
    ctx.velocity.x = ((payload.x - this.lastX) / dt) * 1000;
    ctx.velocity.y = ((payload.y - this.lastY) / dt) * 1000;
    this.lastX = payload.x;
    this.lastY = payload.y;
    this.lastTime = now;
    ctx.position.x = payload.x;
    ctx.position.y = payload.y;
  }

  private handleMouseUp(ctx: BehaviorContext, payload: { x: number; y: number; velocityX: number; velocityY: number }): void {
    ctx.velocity.x = payload.velocityX;
    ctx.velocity.y = payload.velocityY;
    ctx.requestTransition('fall', 'drag-release');
  }
}
