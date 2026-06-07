export interface CronJobParams {
  id: string;
  name?: string;
  interval: number;
  immediate?: boolean;
  timeout?: number;
  maxRetries?: number;
  retryInterval?: number;
  backoffFactor?: number;
  execute: () => Promise<void>;
}

export interface CronJobConfig extends CronJobParams {
  isActive: boolean;
  retryCount: number;
  executedCount: number;
  maxRetries: number;
  retryInterval: number;
  backoffFactor: number;
}
