import { AnimationControl } from '../core/types';
import { DEFAULT_SPRITE_MANIFEST } from './sprite-assets';

export type AnimationCompleteCallback = () => void;

export interface SpriteFrame {
  src: string;
  durationMs?: number;
}

export interface SpriteManifest {
  frameDurationMs?: number;
  clips: Record<string, SpriteFrame[]>;
}

export interface AnimationPlayerOptions {
  spriteManifest?: SpriteManifest | null;
}

export class AnimationPlayer implements AnimationControl {
  private currentClip: string | null = null;
  private loop = true;
  private playing = false;
  private onCompleteCallback: AnimationCompleteCallback | null = null;
  private container: HTMLElement | null = null;
  private animationInstance: any = null;
  private loadToken = 0;
  private spriteManifest: SpriteManifest | null = null;
  private spriteFrames: SpriteFrame[] = [];
  private spriteFrameIndex = 0;
  private spriteImage: HTMLImageElement | null = null;
  private spriteTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(container?: HTMLElement, options: AnimationPlayerOptions = {}) {
    this.container = container ?? null;
    this.spriteManifest = options.spriteManifest === undefined
      ? DEFAULT_SPRITE_MANIFEST
      : options.spriteManifest;
  }

  setContainer(container: HTMLElement): void {
    this.container = container;
  }

  play(clip: string): void {
    if (this.currentClip === clip && this.playing) return;

    this.stop();
    const token = ++this.loadToken;
    this.currentClip = clip;
    this.playing = true;

    if (this.container && typeof window !== 'undefined') {
      if (this.playSpriteClip(clip, token)) return;
      this.loadAndPlay(clip, token);
    }
  }

  stop(): void {
    this.loadToken++;
    this.playing = false;
    this.clearSpriteTimer();
    this.spriteFrames = [];
    this.spriteFrameIndex = 0;
    this.spriteImage = null;
    if (this.animationInstance) {
      this.animationInstance.destroy();
      this.animationInstance = null;
    }
  }

  setLoop(loop: boolean): void {
    this.loop = loop;
    if (this.animationInstance) {
      this.animationInstance.loop = loop;
    }
    if (this.playing && this.spriteFrames.length > 0 && this.spriteTimer === null && (!loop || this.spriteFrames.length > 1)) {
      this.scheduleSpriteAdvance(this.loadToken);
    }
  }

  onComplete(callback: AnimationCompleteCallback): void {
    this.onCompleteCallback = callback;
  }

  getCurrentClip(): string | null {
    return this.currentClip;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  private playSpriteClip(clip: string, token: number): boolean {
    const frames = this.spriteManifest?.clips[clip];
    if (!frames?.length || !this.container) return false;

    this.clearLottieAnimation();
    this.clearSpriteTimer();
    this.container.innerHTML = '';
    this.spriteFrames = frames;
    this.spriteFrameIndex = 0;
    this.spriteImage = document.createElement('img');
    this.spriteImage.className = 'pet-sprite-frame';
    this.spriteImage.alt = '';
    this.spriteImage.draggable = false;
    Object.assign(this.spriteImage.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      pointerEvents: 'none',
      userSelect: 'none',
    });
    this.container.appendChild(this.spriteImage);
    this.renderSpriteFrame();

    if (frames.length > 1 || !this.loop) {
      this.scheduleSpriteAdvance(token);
    }

    return true;
  }

  private advanceSpriteFrame(token: number): void {
    if (this.loadToken !== token || !this.playing || this.spriteFrames.length === 0) return;

    if (this.spriteFrameIndex < this.spriteFrames.length - 1) {
      this.spriteFrameIndex++;
      this.renderSpriteFrame();
      this.scheduleSpriteAdvance(token);
      return;
    }

    if (this.loop) {
      this.spriteFrameIndex = 0;
      this.renderSpriteFrame();
      this.scheduleSpriteAdvance(token);
      return;
    }

    this.completeSpriteClip();
  }

  private renderSpriteFrame(): void {
    if (!this.spriteImage) return;
    const frame = this.spriteFrames[this.spriteFrameIndex];
    if (frame) {
      this.spriteImage.src = frame.src;
    }
  }

  private completeSpriteClip(): void {
    this.clearSpriteTimer();
    this.playing = false;
    this.onCompleteCallback?.();
  }

  private getCurrentFrameDuration(): number {
    return this.spriteFrames[this.spriteFrameIndex]?.durationMs
      ?? this.spriteManifest?.frameDurationMs
      ?? 160;
  }

  private scheduleSpriteAdvance(token: number): void {
    this.clearSpriteTimer();
    this.spriteTimer = setTimeout(() => {
      this.spriteTimer = null;
      this.advanceSpriteFrame(token);
    }, this.getCurrentFrameDuration());
  }

  private clearSpriteTimer(): void {
    if (this.spriteTimer !== null) {
      clearTimeout(this.spriteTimer);
      this.spriteTimer = null;
    }
  }

  private clearLottieAnimation(): void {
    if (this.animationInstance) {
      this.animationInstance.destroy();
      this.animationInstance = null;
    }
  }

  private async loadAndPlay(clip: string, token: number): Promise<void> {
    try {
      const lottie = await import('lottie-web');
      if (this.loadToken !== token || this.currentClip !== clip || !this.playing || !this.container) return;

      this.container.innerHTML = '';
      this.animationInstance = lottie.default.loadAnimation({
        container: this.container,
        renderer: 'svg',
        loop: this.loop,
        autoplay: true,
        path: `./assets/${clip}.json`,
      });

      this.animationInstance.addEventListener('complete', () => {
        if (!this.loop) {
          this.playing = false;
          this.onCompleteCallback?.();
        }
      });
    } catch {
      // Animation asset not found — keep state consistent
      if (this.loadToken === token) {
        this.playing = false;
      }
    }
  }
}
