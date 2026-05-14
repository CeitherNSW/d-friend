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
  private pointerDown = false;
  private dragging = false;
  private suppressNextClick = false;
  private dragThreshold = 3;
  private dragStartClient = { x: 0, y: 0 };
  private dragStartAnchor = { x: 0, y: 0 };
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
    element.addEventListener('click', this.onClick);
    element.addEventListener('dblclick', this.onDoubleClick);
    element.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  detach(): void {
    if (this.element) {
      this.element.removeEventListener('mousedown', this.onMouseDown);
      this.element.removeEventListener('click', this.onClick);
      this.element.removeEventListener('dblclick', this.onDoubleClick);
      this.element.removeEventListener('contextmenu', this.onContextMenu);
    }
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    this.element = null;
    this.pointerDown = false;
    this.dragging = false;
    this.suppressNextClick = false;
    this.positions = [];
  }

  private onMouseDown = (e: MouseEvent): void => {
    if ((e.button ?? 0) !== 0) return;
    const anchor = this.options.getAnchorPosition?.() ?? { x: e.clientX, y: e.clientY };
    this.pointerDown = true;
    this.dragging = false;
    this.dragOffset = {
      x: anchor.x - e.clientX,
      y: anchor.y - e.clientY,
    };
    this.dragStartClient = { x: e.clientX, y: e.clientY };
    this.dragStartAnchor = anchor;
    this.positions = [{ x: anchor.x, y: anchor.y, time: Date.now() }];
  };

  private onClick = (e: MouseEvent): void => {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }
    this.eventBus.emit('click', this.toEventPosition(e));
  };

  private onDoubleClick = (e: MouseEvent): void => {
    this.eventBus.emit('dblclick', this.toEventPosition(e));
  };

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    this.eventBus.emit('contextmenu', { x: e.clientX, y: e.clientY });
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.pointerDown && !this.dragging) return;
    const position = this.toAnchorPosition(e.clientX, e.clientY);

    if (!this.dragging) {
      const distance = Math.hypot(e.clientX - this.dragStartClient.x, e.clientY - this.dragStartClient.y);
      if (distance < this.dragThreshold) return;

      this.dragging = true;
      this.suppressNextClick = true;
      this.eventBus.emit('mouse:down', this.dragStartAnchor);
    }

    this.trackPosition(position.x, position.y);
    this.eventBus.emit('mouse:move', position);
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (!this.pointerDown && !this.dragging) return;
    this.pointerDown = false;
    if (!this.dragging) {
      this.positions = [];
      return;
    }
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

  private toEventPosition(e: MouseEvent): { x: number; y: number } {
    return this.options.getAnchorPosition?.() ?? { x: e.clientX, y: e.clientY };
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
