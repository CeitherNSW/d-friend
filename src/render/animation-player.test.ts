/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimationPlayer, SpriteManifest } from './animation-player';

const { loadAnimationMock } = vi.hoisted(() => ({
  loadAnimationMock: vi.fn(),
}));

vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: loadAnimationMock,
  },
}));

describe('AnimationPlayer', () => {
  beforeEach(() => {
    vi.useRealTimers();
    loadAnimationMock.mockReset();
    loadAnimationMock.mockReturnValue({
      destroy: vi.fn(),
      addEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should track current clip name', () => {
    const player = new AnimationPlayer();
    player.play('idle');
    expect(player.getCurrentClip()).toBe('idle');
  });

  it('should report playing state', () => {
    const player = new AnimationPlayer();
    expect(player.isPlaying()).toBe(false);
    player.play('walk');
    expect(player.isPlaying()).toBe(true);
    player.stop();
    expect(player.isPlaying()).toBe(false);
  });

  it('should not restart same clip if already playing', () => {
    const player = new AnimationPlayer();
    player.play('idle');
    const stopSpy = vi.spyOn(player, 'stop');
    player.play('idle');
    expect(stopSpy).not.toHaveBeenCalled();
  });

  it('should switch clips without error', () => {
    const player = new AnimationPlayer();
    player.play('idle');
    player.play('walk');
    expect(player.getCurrentClip()).toBe('walk');
  });

  it('should set loop mode', () => {
    const player = new AnimationPlayer();
    player.setLoop(false);
    player.play('jump');
    expect(player.isPlaying()).toBe(true);
  });

  it('should not start a pending animation after stop', async () => {
    const container = document.createElement('div');
    const player = new AnimationPlayer(container);

    player.play('idle');
    player.stop();
    await vi.dynamicImportSettled();

    expect(loadAnimationMock).not.toHaveBeenCalled();
  });

  it('should fall back to Lottie when a sprite clip is missing', async () => {
    const container = document.createElement('div');
    const player = new AnimationPlayer(container, {
      spriteManifest: createSpriteManifest(),
    });

    player.play('walk');
    await vi.dynamicImportSettled();

    expect(loadAnimationMock).toHaveBeenCalledOnce();
    expect(loadAnimationMock).toHaveBeenCalledWith(expect.objectContaining({
      container,
      path: './assets/walk.json',
    }));
  });

  it('should render sprite frames for a matching clip without loading Lottie', async () => {
    const container = document.createElement('div');
    const player = new AnimationPlayer(container, {
      spriteManifest: createSpriteManifest(),
    });

    player.play('idle');
    await vi.dynamicImportSettled();

    const frame = container.querySelector('img');
    expect(frame).not.toBeNull();
    expect(frame?.getAttribute('src')).toBe('/sprites/idle_01.png');
    expect(frame?.className).toBe('pet-sprite-frame');
    expect(loadAnimationMock).not.toHaveBeenCalled();
  });

  it('should advance sprite frames while looping', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const player = new AnimationPlayer(container, {
      spriteManifest: createSpriteManifest(),
    });

    player.play('idle');
    vi.advanceTimersByTime(120);

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/sprites/idle_02.png');

    vi.advanceTimersByTime(120);

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/sprites/idle_01.png');
  });

  it('should complete a non-looping sprite clip on the final frame', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const onComplete = vi.fn();
    const player = new AnimationPlayer(container, {
      spriteManifest: createSpriteManifest(),
    });

    player.setLoop(false);
    player.onComplete(onComplete);
    player.play('happy');
    vi.advanceTimersByTime(120);

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/sprites/petting_02.png');

    vi.advanceTimersByTime(120);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(player.isPlaying()).toBe(false);
  });

  it('should honor non-looping mode set after a single-frame sprite clip starts', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const onComplete = vi.fn();
    const player = new AnimationPlayer(container, {
      spriteManifest: {
        frameDurationMs: 120,
        clips: {
          jump: [
            { src: '/sprites/jump_01.png' },
          ],
        },
      },
    });

    player.onComplete(onComplete);
    player.play('jump');
    player.setLoop(false);
    vi.advanceTimersByTime(120);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(player.isPlaying()).toBe(false);
  });
});

function createSpriteManifest(): SpriteManifest {
  return {
    frameDurationMs: 120,
    clips: {
      idle: [
        { src: '/sprites/idle_01.png' },
        { src: '/sprites/idle_02.png' },
      ],
      happy: [
        { src: '/sprites/petting_01.png' },
        { src: '/sprites/petting_02.png' },
      ],
    },
  };
}
