import { ScreenBounds } from './types';

export class ScreenBoundsProvider {
  private bounds: ScreenBounds;

  constructor(workArea: { x: number; y: number; width: number; height: number }) {
    this.bounds = this.computeBounds(workArea);
  }

  private computeBounds(workArea: { x: number; y: number; width: number; height: number }): ScreenBounds {
    return {
      left: workArea.x,
      right: workArea.x + workArea.width,
      top: workArea.y,
      bottom: workArea.y + workArea.height,
      groundY: workArea.y + workArea.height,
    };
  }

  getBounds(): ScreenBounds {
    return { ...this.bounds };
  }

  getGroundY(): number {
    return this.bounds.groundY;
  }

  update(workArea: { x: number; y: number; width: number; height: number }): void {
    this.bounds = this.computeBounds(workArea);
  }
}
