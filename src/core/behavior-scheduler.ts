import { BehaviorStateMachine } from './state-machine';

interface SchedulerWeight {
  behaviorId: string;
  weight: number;
}

export class BehaviorScheduler {
  private stateMachine: BehaviorStateMachine;
  private weights: SchedulerWeight[];
  private interval: number;
  private elapsed = 0;
  private active = false;

  constructor(
    stateMachine: BehaviorStateMachine,
    weights: SchedulerWeight[],
    interval: number = 5000,
  ) {
    this.stateMachine = stateMachine;
    this.weights = weights;
    this.interval = interval;
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

    this.elapsed += dt;
    if (this.elapsed < this.interval) return;

    this.elapsed = 0;
    const current = this.stateMachine.getCurrentBehavior();
    if (!current || current.id !== 'idle') return;

    const chosen = this.pickWeighted();
    if (chosen) {
      this.stateMachine.requestTransition(chosen, 'scheduler');
    }
  }

  private pickWeighted(): string | null {
    const totalWeight = this.weights.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight === 0) return null;

    let random = Math.random() * totalWeight;
    for (const entry of this.weights) {
      random -= entry.weight;
      if (random <= 0) return entry.behaviorId;
    }
    return this.weights[this.weights.length - 1].behaviorId;
  }

  isActive(): boolean {
    return this.active;
  }

  setInterval(ms: number): void {
    this.interval = ms;
  }
}
