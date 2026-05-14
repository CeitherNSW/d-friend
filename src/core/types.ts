import { EventBus } from './event-bus';
import { ConfigReader } from './config';

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface AnimationControl {
  play(clip: string): void;
  stop(): void;
  setLoop(loop: boolean): void;
}

export interface ScreenBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  groundY: number;
}

export interface BehaviorContext {
  position: Position;
  velocity: Velocity;
  animation: AnimationControl;
  eventBus: EventBus;
  config?: ConfigReader;
  bounds: ScreenBounds;
  elapsed: number;
  requestTransition: (id: string, reason: string) => void;
}

export interface Behavior {
  id: string;
  priority: number;
  enter(ctx: BehaviorContext): void;
  update(ctx: BehaviorContext, dt: number): void;
  exit(ctx: BehaviorContext): void;
  canTransitionTo(nextId: string): boolean;
}
