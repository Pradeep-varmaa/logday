export interface StepEvent {
  stepsAdded: number;
  totalSteps: number;
  timestamp: number;
}

export interface StepsProvider {
  id: string;
  name: string;
  isAvailable: () => Promise<boolean>;
  startTracking: (onStep: (event: StepEvent) => void) => Promise<boolean>;
  stopTracking: () => void;
  getTodaySteps: () => Promise<number>;
}
