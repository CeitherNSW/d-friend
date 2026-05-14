import { EventBus } from '../core/event-bus';
import { BehaviorRegistry } from '../core/behavior-registry';
import { BehaviorStateMachine } from '../core/state-machine';
import { BehaviorScheduler, SchedulerWeight } from '../core/behavior-scheduler';
import { ConfigReader, DEFAULT_PET_CONFIG, createObjectConfigReader } from '../core/config';
import { AnimationControl, BehaviorContext, ScreenBounds } from '../core/types';
import { DragBehavior, FallBehavior, IdleBehavior, JumpBehavior, PettingBehavior, WalkBehavior } from '../behaviors';
import { AnimationPlayer } from './animation-player';
import { MouseBridge } from './mouse-bridge';

interface ViewportSize {
  width: number;
  height: number;
}

interface MousePassthroughControl {
  setIgnoreMouseEvents(ignore: boolean): void;
}

interface SystemMenuControl {
  showPetContextMenu(position: { x: number; y: number }): void;
}

export interface PetRuntimeOptions {
  viewport?: ViewportSize;
  animation?: AnimationControl;
  mousePassthrough?: MousePassthroughControl;
  systemMenu?: SystemMenuControl;
  config?: ConfigReader;
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
  let viewport = getViewport(options);
  let dragging = false;
  let frameId: number | null = null;
  let lastFrameTime = 0;
  let pettingReturnBehaviorId = 'idle';
  let pendingClickTimer: ReturnType<typeof setTimeout> | null = null;
  const animation = options.animation ?? new AnimationPlayer(pet);
  const config = options.config ?? createObjectConfigReader(DEFAULT_PET_CONFIG);

  registry.register(new IdleBehavior());
  registry.register(new WalkBehavior());
  registry.register(new JumpBehavior());
  registry.register(new DragBehavior());
  registry.register(new FallBehavior());
  registry.register(new PettingBehavior(() => pettingReturnBehaviorId));

  pet.style.position = 'absolute';
  pet.style.transform = 'none';
  pet.style.bottom = 'auto';

  const ctx: BehaviorContext = {
    position: { x: viewport.width / 2, y: viewport.height },
    velocity: { x: 0, y: 0 },
    animation,
    eventBus,
    config,
    bounds: computeBounds(viewport, pet),
    elapsed: 0,
    requestTransition: () => false,
  };

  const stateMachine = new BehaviorStateMachine(registry, ctx, eventBus);
  const scheduler = new BehaviorScheduler(
    stateMachine,
    getSchedulerWeights(config),
    config.get('scheduler.intervalMs', DEFAULT_PET_CONFIG.scheduler.intervalMs),
    {
      cooldowns: config.get('scheduler.cooldowns', DEFAULT_PET_CONFIG.scheduler.cooldowns),
      interactionPauseMs: config.get('scheduler.interactionPauseMs', DEFAULT_PET_CONFIG.scheduler.interactionPauseMs),
    },
  );
  const mouseBridge = new MouseBridge(eventBus, {
    getAnchorPosition: () => ({ ...ctx.position }),
  });

  function render(): void {
    const size = getPetSize(pet);
    const x = clamp(ctx.position.x, ctx.bounds.left, ctx.bounds.right);
    const y = clamp(ctx.position.y, ctx.bounds.top + size.height, ctx.bounds.groundY);
    const behaviorId = stateMachine.getCurrentBehavior()?.id ?? '';
    pet.dataset.behavior = behaviorId;
    if (behaviorId === 'walk' && Math.abs(ctx.velocity.x) > 0.01) {
      pet.dataset.direction = ctx.velocity.x > 0 ? 'right' : 'left';
    }
    pet.classList.toggle('is-idle', behaviorId === 'idle');
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
    cancelPendingClick();
    scheduler.pauseAfterInteraction();
    options.mousePassthrough?.setIgnoreMouseEvents(false);
    ctx.position.x = clamp(payload.x, ctx.bounds.left, ctx.bounds.right);
    ctx.position.y = clamp(payload.y, ctx.bounds.top + getPetSize(pet).height, ctx.bounds.groundY);
    stateMachine.requestTransition('drag', 'mouse-down');
    render();
  };

  const handleMouseUp = (): void => {
    dragging = false;
    scheduler.pauseAfterInteraction();
    options.mousePassthrough?.setIgnoreMouseEvents(true);
  };

  const handleClick = (): void => {
    if (dragging) return;

    cancelPendingClick();
    pendingClickTimer = setTimeout(() => {
      const currentBehaviorId = stateMachine.getCurrentBehavior()?.id ?? 'idle';
      pettingReturnBehaviorId = currentBehaviorId === 'petting' ? pettingReturnBehaviorId : currentBehaviorId;
      scheduler.pauseAfterInteraction();
      stateMachine.requestTransition('petting', 'click');
      render();
      pendingClickTimer = null;
    }, config.get('petting.clickDelayMs', DEFAULT_PET_CONFIG.petting.clickDelayMs));
  };

  const handleDoubleClick = (): void => {
    cancelPendingClick();
    scheduler.pauseAfterInteraction();
    stateMachine.requestTransition('jump', 'double-click');
    render();
  };

  const handleContextMenu = (payload: { x: number; y: number }): void => {
    cancelPendingClick();
    scheduler.pauseAfterInteraction();
    options.systemMenu?.showPetContextMenu(payload);
  };

  function cancelPendingClick(): void {
    if (pendingClickTimer !== null) {
      clearTimeout(pendingClickTimer);
      pendingClickTimer = null;
    }
  }

  pet.addEventListener('mouseenter', handleMouseEnter);
  pet.addEventListener('mouseleave', handleMouseLeave);
  eventBus.on('mouse:down', handleMouseDown);
  eventBus.on('mouse:up', handleMouseUp);
  eventBus.on('click', handleClick);
  eventBus.on('dblclick', handleDoubleClick);
  eventBus.on('contextmenu', handleContextMenu);
  mouseBridge.attach(pet);
  stateMachine.start('idle');
  scheduler.start();
  render();

  const runtime: PetRuntime = {
    ctx,
    step(dt: number): void {
      scheduler.update(dt);
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
      cancelPendingClick();
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      scheduler.stop();
      mouseBridge.detach();
      eventBus.off('mouse:down', handleMouseDown);
      eventBus.off('mouse:up', handleMouseUp);
      eventBus.off('click', handleClick);
      eventBus.off('dblclick', handleDoubleClick);
      eventBus.off('contextmenu', handleContextMenu);
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

function getSchedulerWeights(config: ConfigReader): SchedulerWeight[] {
  return [
    {
      behaviorId: 'idle',
      weight: config.get('scheduler.weights.idle', DEFAULT_PET_CONFIG.scheduler.weights.idle),
    },
    {
      behaviorId: 'walk',
      weight: config.get('scheduler.weights.walk', DEFAULT_PET_CONFIG.scheduler.weights.walk),
    },
    {
      behaviorId: 'jump',
      weight: config.get('scheduler.weights.jump', DEFAULT_PET_CONFIG.scheduler.weights.jump),
    },
  ];
}
