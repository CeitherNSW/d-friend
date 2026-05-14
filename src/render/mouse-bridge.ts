import { EventBus } from '../core/event-bus';

interface MouseBridgeOptions {
  getAnchorPosition?: () => { x: number; y: number };
}

export class MouseBridge {
  private eventBus: EventBus;
  private options: MouseBridgeOptions;
  private element: HTMLElement | null = null;
  private positions: Array<{ x: number; y: number; time: number }> = [];
  private maxPositions = 5;
  private dragging = false;
  private dragOffset = { x: 0, y: 0 };

  constructor(eventBus: EventBus, options: MouseBridgeOptions = {}) {
    this.eventBus = eventBus;
    this.options = options;
  }

  attach(element: HTMLElement): void {
    if (this.element) {
      this.detach();
    }
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
    this.dragging = false;
    this.positions = [];
  }

  private onMouseDown = (e: MouseEvent): void => {
    if ((e.button ?? 0) !== 0) return;
    const anchor = this.options.getAnchorPosition?.() ?? { x: e.clientX, y: e.clientY };
    this.dragOffset = {
      x: anchor.x - e.clientX,
      y: anchor.y - e.clientY,
    };
    this.dragging = true;
    this.positions = [{ x: anchor.x, y: anchor.y, time: Date.now() }];
    this.eventBus.emit('mouse:down', anchor);
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.dragging) return;
    const position = this.toAnchorPosition(e.clientX, e.clientY);
    this.trackPosition(position.x, position.y);
    this.eventBus.emit('mouse:move', position);
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (!this.dragging) return;
    this.dragging = false;
    const position = this.toAnchorPosition(e.clientX, e.clientY);
    this.trackPosition(position.x, position.y);
    const velocity = this.calculateVelocity();
    this.eventBus.emit('mouse:up', {
      x: position.x,
      y: position.y,
      velocityX: velocity.x,
      velocityY: velocity.y,
    });
    this.positions = [];
  };

  private toAnchorPosition(x: number, y: number): { x: number; y: number } {
    return {
      x: x + this.dragOffset.x,
      y: y + this.dragOffset.y,
    };
  }

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
