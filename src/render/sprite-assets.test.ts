import { describe, expect, it } from 'vitest';
import { DEFAULT_SPRITE_MANIFEST } from './sprite-assets';

describe('DEFAULT_SPRITE_MANIFEST', () => {
  it('should expose multiple random idle variants from the British Blue Shorthair set', () => {
    const variants = DEFAULT_SPRITE_MANIFEST.clipVariants?.idle ?? [];

    expect(variants.length).toBeGreaterThanOrEqual(4);
    expect(new Set(variants.map((frames) => frames[0]?.src)).size).toBe(variants.length);
    expect(variants.some((frames) => frames[0]?.src.includes('loaf'))).toBe(true);
    expect(variants.some((frames) => frames[0]?.src.includes('side'))).toBe(true);
  });

  it('should bind drag to the held pose and walk to four generated frames', () => {
    expect(DEFAULT_SPRITE_MANIFEST.clips.drag[0]?.src).toContain('held');
    expect(DEFAULT_SPRITE_MANIFEST.clips.walk).toHaveLength(4);
    expect(DEFAULT_SPRITE_MANIFEST.clips.walk[0]?.src).toContain('walk_01');
  });

  it('should give petting two visual variants and random mirroring to non-walk clips only', () => {
    const happyVariants = DEFAULT_SPRITE_MANIFEST.clipVariants?.happy ?? [];
    const randomFlipClips = DEFAULT_SPRITE_MANIFEST.randomFlipClips ?? [];

    expect(happyVariants).toHaveLength(2);
    expect(happyVariants.some((frames) => frames[0]?.src.includes('stand'))).toBe(true);
    expect(happyVariants.some((frames) => frames[0]?.src.includes('spluff'))).toBe(true);
    expect(randomFlipClips).toEqual(expect.arrayContaining(['idle', 'happy', 'jump', 'drag', 'fall']));
    expect(randomFlipClips).not.toContain('walk');
  });
});
