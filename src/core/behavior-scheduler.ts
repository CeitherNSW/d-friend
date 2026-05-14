import { BehaviorStateMachine } from './state-machine';
import { DEFAULT_PET_CONFIG } from './config';

export interface SchedulerWeight {
  behaviorId: string;
  weight: number;
}

export interface BehaviorSchedulerOptions {
  cooldowns?: Record<string, number>;
  interactionPauseMs?: number;
  random?: () => number;
}

export class BehaviorScheduler {
  private stateMachine: BehaviorStateMachine;
  private weights: SchedulerWeight[];
  private interval: number;
  private elapsed = 0;
  private active = false;
  private cooldowns: Record<string, number>;
  private cooldownRemaining = new Map<string, number>();
  private interactionPauseMs: number;
  private pauseRemaining = 0;
  private random: () => number;

  constructor(
    stateMachine: BehaviorStateMachine,
    weights: SchedulerWeight[] = [
      { behaviorId: 'idle', weight: DEFAULT_PET_CONFIG.scheduler.weights.idle },
      { behaviorId: 'walk', weight: DEFAULT_PET_CONFIG.scheduler.weights.walk },
      { behaviorId: 'jump', weight: DEFAULT_PET_CONFIG.scheduler.weights.jump },
    ],
    interval: number = 5000,
    options: BehaviorSchedulerOptions = {},
  ) {
    this.stateMachine = stateMachine;
    this.weights = weights;
    this.interval = interval;
    this.cooldowns = options.cooldowns ?? {};
    this.interactionPauseMs = options.interactionPauseMs ?? DEFAULT_PET_CONFIG.scheduler.interactionPauseMs;
    this.random = options.random ?? Math.random;
  }

  start(): void {
    this.active = true;
    this.elapsed = 0;
  }

  stop(): void {
    this.active = false;
  }

  update(dt: number): void {
    if (!this.active) return;

    this.tickCooldowns(dt);

    if (this.pauseRemaining > 0) {
      this.pauseRemaining = Math.max(0, this.pauseRemaining - dt);
      this.elapsed = 0;
      return;
    }

    this.elapsed += dt;
    if (this.elapsed < this.interval) return;

    this.elapsed = 0;
    const current = this.stateMachine.getCurrentBehavior();
    if (!current || current.id !== 'idle') return;

    const chosen = this.pickWeighted();
    if (chosen && chosen !== current.id) {
      const transitioned = this.stateMachine.requestTransition(chosen, 'scheduler');
      if (transitioned) {
        this.startCooldown(chosen);
      }
    }
  }

  private pickWeighted(): string | null {
    const eligible = this.weights.filter((entry) => entry.weight > 0 && !this.isCoolingDown(entry.behaviorId));
    const totalWeight = eligible.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight === 0) return null;

    let random = this.random() * totalWeight;
    for (const entry of eligible) {
      random -= entry.weight;
      if (random <= 0) return entry.behaviorId;
    }
    return eligible[eligible.length - 1].behaviorId;
  }

  private tickCooldowns(dt: number): void {
    for (const [behaviorId, remaining] of this.cooldownRemaining) {
      const nextRemaining = remaining - dt;
      if (nextRemaining <= 0) {
        this.cooldownRemaining.delete(behaviorId);
      } else {
        this.cooldownRemaining.set(behaviorId, nextRemaining);
      }
    }
  }

  private startCooldown(behaviorId: string): void {
    const cooldown = this.cooldowns[behaviorId] ?? 0;
    if (cooldown > 0) {
      this.cooldownRemaining.set(behaviorId, cooldown);
    }
  }

  private isCoolingDown(behaviorId: string): boolean {
    return (this.cooldownRemaining.get(behaviorId) ?? 0) > 0;
  }

  isActive(): boolean {
    return this.active;
  }

  setInterval(ms: number): void {
    this.interval = ms;
  }

  setWeights(weights: SchedulerWeight[]): void {
    this.weights = weights;
  }

  pauseAfterInteraction(): void {
    this.pauseRemaining = this.interactionPauseMs;
    this.elapsed = 0;
  }
}
