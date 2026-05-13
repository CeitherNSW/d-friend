import { describe, it, expect, vi } from 'vitest';
import { AnimationPlayer } from './animation-player';

describe('AnimationPlayer', () => {
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
});
