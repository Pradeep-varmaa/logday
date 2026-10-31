import { StepsProvider, StepEvent } from './types';

export class ManualStepsProvider implements StepsProvider {
  id = 'manual';
  name = 'Manual Entry';

  private currentSteps = 0;
  private listener: ((event: StepEvent) => void) | null = null;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async startTracking(onStep: (event: StepEvent) => void): Promise<boolean> {
    this.listener = onStep;
    return true;
  }

  stopTracking(): void {
    this.listener = null;
  }

  async getTodaySteps(): Promise<number> {
    return this.currentSteps;
  }

  addSteps(delta: number): number {
    this.currentSteps = Math.max(0, this.currentSteps + delta);
    if (this.listener) {
      this.listener({
        stepsAdded: delta,
        totalSteps: this.currentSteps,
        timestamp: Date.now(),
      });
    }
    return this.currentSteps;
  }

  setSteps(total: number): number {
    const delta = total - this.currentSteps;
    this.currentSteps = Math.max(0, total);
    if (this.listener) {
      this.listener({
        stepsAdded: delta,
        totalSteps: this.currentSteps,
        timestamp: Date.now(),
      });
    }
    return this.currentSteps;
  }
}

export const manualStepsProvider = new ManualStepsProvider();
