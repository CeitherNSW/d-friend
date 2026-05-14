import { EventBus } from '../core/event-bus';
import { BehaviorRegistry } from '../core/behavior-registry';
import { BehaviorStateMachine } from '../core/state-machine';
import { AnimationControl, BehaviorContext, ScreenBounds } from '../core/types';
import { DragBehavior, FallBehavior, IdleBehavior, JumpBehavior, WalkBehavior } from '../behaviors';
import { AnimationPlayer } from './animation-player';
import { MouseBridge } from './mouse-bridge';

interface ViewportSize {
  width: number;
  height: number;
}

interface MousePassthroughControl {
  setIgnoreMouseEvents(ignore: boolean): void;
}

export interface PetRuntimeOptions {
  viewport?: ViewportSize;
  animation?: AnimationControl;
  mousePassthrough?: MousePassthroughControl;
}

export interface PetRuntime {
  step(dt: number): void;
  start(): void;
  destroy(): void;
  getCurrentBehaviorId(): string | null;
  setViewport(viewport: ViewportSize): void;
  readonly ctx: BehaviorContext;
}

function getViewport(options: PetRuntimeOptions): ViewportSize {
  if (options.viewport) return options.viewport;
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function getPetSize(pet: HTMLElement): ViewportSize {
  const rect = pet.getBoundingClientRect();
  return {
    width: pet.offsetWidth || rect.width || 80,
    height: pet.offsetHeight || rect.height || 80,
  };
}

function computeBounds(viewport: ViewportSize, pet: HTMLElement): ScreenBounds {
  const size = getPetSize(pet);
  return {
    left: size.width / 2,
    right: viewport.width - size.width / 2,
    top: 0,
    bottom: viewport.height,
    groundY: viewport.height,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createPetRuntime(pet: HTMLElement, options: PetRuntimeOptions = {}): PetRuntime {
  const eventBus = new EventBus();
  const registry = new BehaviorRegistry();
  const mouseBridge = new MouseBridge(eventBus);
  const animation = options.animation ?? new AnimationPlayer(pet);
  let viewport = getViewport(options);
  let dragging = false;
  let frameId: number | null = null;
  let lastFrameTime = 0;

  registry.register(new IdleBehavior());
  registry.register(new WalkBehavior());
  registry.register(new JumpBehavior());
  registry.register(new DragBehavior());
  registry.register(new FallBehavior());

  pet.style.position = 'absolute';
  pet.style.transform = 'none';
  pet.style.bottom = 'auto';

  const ctx: BehaviorContext = {
    position: { x: viewport.width / 2, y: viewport.height },
    velocity: { x: 0, y: 0 },
    animation,
    eventBus,
    bounds: computeBounds(viewport, pet),
    elapsed: 0,
    requestTransition: () => false,
  };

  const stateMachine = new BehaviorStateMachine(registry, ctx, eventBus);

  function render(): void {
    const size = getPetSize(pet);
    const x = clamp(ctx.position.x, ctx.bounds.left, ctx.bounds.right);
    const y = clamp(ctx.position.y, ctx.bounds.top + size.height, ctx.bounds.groundY);
    pet.style.left = `${x - size.width / 2}px`;
    pet.style.top = `${y - size.height}px`;
  }

  const handleMouseEnter = (): void => {
    options.mousePassthrough?.setIgnoreMouseEvents(false);
  };

  const handleMouseLeave = (): void => {
    if (!dragging) {
      options.mousePassthrough?.setIgnoreMouseEvents(true);
    }
  };

  const handleMouseDown = (payload: { x: number; y: number }): void => {
    dragging = true;
    options.mousePassthrough?.setIgnoreMouseEvents(false);
    ctx.position.x = clamp(payload.x, ctx.bounds.left, ctx.bounds.right);
    ctx.position.y = clamp(payload.y, ctx.bounds.top + getPetSize(pet).height, ctx.bounds.groundY);
    stateMachine.requestTransition('drag', 'mouse-down');
    render();
  };

  const handleMouseUp = (): void => {
    dragging = false;
    options.mousePassthrough?.setIgnoreMouseEvents(true);
  };

  pet.addEventListener('mouseenter', handleMouseEnter);
  pet.addEventListener('mouseleave', handleMouseLeave);
  eventBus.on('mouse:down', handleMouseDown);
  eventBus.on('mouse:up', handleMouseUp);
  mouseBridge.attach(pet);
  stateMachine.start('idle');
  render();

  const runtime: PetRuntime = {
    ctx,
    step(dt: number): void {
      stateMachine.update(dt);
      render();
    },
    start(): void {
      if (frameId !== null) return;
      lastFrameTime = performance.now();
      const tick = (now: number): void => {
        const dt = now - lastFrameTime;
        lastFrameTime = now;
        runtime.step(dt);
        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
    },
    destroy(): void {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      mouseBridge.detach();
      eventBus.off('mouse:down', handleMouseDown);
      eventBus.off('mouse:up', handleMouseUp);
      pet.removeEventListener('mouseenter', handleMouseEnter);
      pet.removeEventListener('mouseleave', handleMouseLeave);
      eventBus.clear();
    },
    getCurrentBehaviorId(): string | null {
      return stateMachine.getCurrentBehavior()?.id ?? null;
    },
    setViewport(nextViewport: ViewportSize): void {
      viewport = nextViewport;
      Object.assign(ctx.bounds, computeBounds(viewport, pet));
      ctx.position.x = clamp(ctx.position.x, ctx.bounds.left, ctx.bounds.right);
      ctx.position.y = clamp(ctx.position.y, ctx.bounds.top + getPetSize(pet).height, ctx.bounds.groundY);
      render();
    },
  };

  return runtime;
}
