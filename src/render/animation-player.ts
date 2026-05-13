import { AnimationControl } from '../core/types';

export type AnimationCompleteCallback = () => void;

export class AnimationPlayer implements AnimationControl {
  private currentClip: string | null = null;
  private loop = true;
  private playing = false;
  private onCompleteCallback: AnimationCompleteCallback | null = null;
  private container: HTMLElement | null = null;
  private animationInstance: any = null;

  constructor(container?: HTMLElement) {
    this.container = container ?? null;
  }

  setContainer(container: HTMLElement): void {
    this.container = container;
  }

  play(clip: string): void {
    if (this.currentClip === clip && this.playing) return;

    this.stop();
    this.currentClip = clip;
    this.playing = true;

    if (this.container && typeof window !== 'undefined') {
      this.loadAndPlay(clip);
    }
  }

  stop(): void {
    this.playing = false;
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

  private async loadAndPlay(clip: string): Promise<void> {
    try {
      const lottie = await import('lottie-web');
      if (this.currentClip !== clip) return;

      this.container!.innerHTML = '';
      this.animationInstance = lottie.default.loadAnimation({
        container: this.container!,
        renderer: 'svg',
        loop: this.loop,
        autoplay: true,
        path: `./assets/${clip}.json`,
      });

      this.animationInstance.addEventListener('complete', () => {
        if (!this.loop && this.onCompleteCallback) {
          this.onCompleteCallback();
        }
      });
    } catch {
      // Animation asset not found — keep state consistent
      this.playing = false;
    }
  }
}
