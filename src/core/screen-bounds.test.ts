import { describe, it, expect } from 'vitest';
import { ScreenBoundsProvider } from './screen-bounds';

describe('ScreenBoundsProvider', () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1040 };

  it('should compute bounds from workArea', () => {
    const provider = new ScreenBoundsProvider(workArea);
    const bounds = provider.getBounds();
    expect(bounds.left).toBe(0);
    expect(bounds.right).toBe(1920);
    expect(bounds.top).toBe(0);
    expect(bounds.bottom).toBe(1040);
    expect(bounds.groundY).toBe(1040);
  });

  it('should return groundY', () => {
    const provider = new ScreenBoundsProvider(workArea);
    expect(provider.getGroundY()).toBe(1040);
  });

  it('should handle offset workArea (e.g. taskbar on left)', () => {
    const provider = new ScreenBoundsProvider({ x: 64, y: 0, width: 1856, height: 1080 });
    const bounds = provider.getBounds();
    expect(bounds.left).toBe(64);
    expect(bounds.right).toBe(1920);
    expect(bounds.groundY).toBe(1080);
  });

  it('should update bounds when display changes', () => {
    const provider = new ScreenBoundsProvider(workArea);
    provider.update({ x: 0, y: 0, width: 2560, height: 1400 });
    const bounds = provider.getBounds();
    expect(bounds.right).toBe(2560);
    expect(bounds.groundY).toBe(1400);
  });
});
