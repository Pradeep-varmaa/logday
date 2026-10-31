import { StepsProvider, StepEvent } from './types';

export class MotionStepsProvider implements StepsProvider {
  id = 'device-motion';
  name = 'Live Device Motion Counter';

  private active = false;
  private sessionSteps = 0;
  private onStepCallback: ((event: StepEvent) => void) | null = null;

  // Low pass filter & peak detection state
  private alpha = 0.8; // filter weight
  private filteredAccel = 9.8; // Gravity baseline
  private isAboveThreshold = false;
  private lastStepTime = 0;

  // Thresholds
  private PEAK_THRESHOLD = 11.2; // m/s^2
  private MIN_STEP_INTERVAL_MS = 280; // max ~3.5 steps/sec

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    return 'DeviceMotionEvent' in window;
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // iOS 13+ requires explicit user gesture permission request
    if (
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        return response === 'granted';
      } catch (err) {
        console.warn('DeviceMotionEvent permission denied:', err);
        return false;
      }
    }

    // Android & standard desktop browsers
    return true;
  }

  async startTracking(onStep: (event: StepEvent) => void): Promise<boolean> {
    const granted = await this.requestPermission();
    if (!granted) return false;

    this.onStepCallback = onStep;
    this.sessionSteps = 0;
    this.active = true;

    window.addEventListener('devicemotion', this.handleMotion, false);
    return true;
  }

  stopTracking(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.handleMotion, false);
    }
    this.active = false;
    this.onStepCallback = null;
  }

  async getTodaySteps(): Promise<number> {
    return this.sessionSteps;
  }

  private handleMotion = (event: DeviceMotionEvent) => {
    if (!this.active || !event.accelerationIncludingGravity) return;

    const { x, y, z } = event.accelerationIncludingGravity;
    if (x === null || y === null || z === null) return;

    // Vector magnitude
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    // Low-pass filter smoothing
    this.filteredAccel = this.alpha * this.filteredAccel + (1 - this.alpha) * magnitude;

    const now = Date.now();

    // Peak detection logic
    if (this.filteredAccel > this.PEAK_THRESHOLD && !this.isAboveThreshold) {
      if (now - this.lastStepTime > this.MIN_STEP_INTERVAL_MS) {
        this.sessionSteps += 1;
        this.lastStepTime = now;
        this.isAboveThreshold = true;

        if (this.onStepCallback) {
          this.onStepCallback({
            stepsAdded: 1,
            totalSteps: this.sessionSteps,
            timestamp: now,
          });
        }
      }
    } else if (this.filteredAccel < this.PEAK_THRESHOLD - 0.5) {
      this.isAboveThreshold = false;
    }
  };
}

export const motionStepsProvider = new MotionStepsProvider();
