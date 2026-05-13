import { EventBus } from '../core/event-bus';

export class MouseBridge {
  private eventBus: EventBus;
  private element: HTMLElement | null = null;
  private positions: Array<{ x: number; y: number; time: number }> = [];
  private maxPositions = 5;
  private dragging = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  attach(element: HTMLElement): void {
    this.element = element;
    element.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  detach(): void {
    if (this.element) {
      this.element.removeEventListener('mousedown', this.onMouseDown);
    }
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    this.element = null;
  }

  private onMouseDown = (e: MouseEvent): void => {
    this.dragging = true;
    this.positions = [{ x: e.clientX, y: e.clientY, time: Date.now() }];
    this.eventBus.emit('mouse:down', { x: e.clientX, y: e.clientY });
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.dragging) return;
    this.trackPosition(e.clientX, e.clientY);
    this.eventBus.emit('mouse:move', { x: e.clientX, y: e.clientY });
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (!this.dragging) return;
    this.dragging = false;
    const velocity = this.calculateVelocity();
    this.eventBus.emit('mouse:up', {
      x: e.clientX,
      y: e.clientY,
      velocityX: velocity.x,
      velocityY: velocity.y,
    });
    this.positions = [];
  };

  private trackPosition(x: number, y: number): void {
    this.positions.push({ x, y, time: Date.now() });
    if (this.positions.length > this.maxPositions) {
      this.positions.shift();
    }
  }

  private calculateVelocity(): { x: number; y: number } {
    if (this.positions.length < 2) return { x: 0, y: 0 };
    const first = this.positions[0];
    const last = this.positions[this.positions.length - 1];
    const dt = Math.max(1, last.time - first.time) / 1000;
    return {
      x: (last.x - first.x) / dt,
      y: (last.y - first.y) / dt,
    };
  }
}
