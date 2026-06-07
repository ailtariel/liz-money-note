import type { CronJobConfig, CronJobParams } from './types';

let instance: ReturnType<typeof createCronJobManager> | null = null;

function createCronJobManager() {
  const jobs = new Map<string, CronJobConfig>();
  const intervalTimers = new Map<string, ReturnType<typeof setInterval>>();
  const retryTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function clearIntervalTimer(jobId: string) {
    const timer = intervalTimers.get(jobId);
    if (timer) {
      clearInterval(timer);
      intervalTimers.delete(jobId);
    }
  }

  function clearRetryTimer(jobId: string) {
    const timer = retryTimers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      retryTimers.delete(jobId);
    }
  }

  function removeJob(jobId: string) {
    clearIntervalTimer(jobId);
    clearRetryTimer(jobId);
    jobs.delete(jobId);
  }

  async function runJob(jobId: string) {
    const job = jobs.get(jobId);
    if (!job?.isActive || document.hidden) {
      return;
    }

    try {
      if (job.timeout) {
        await Promise.race([
          job.execute(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Cron job timeout.')), job.timeout);
          })
        ]);
      } else {
        await job.execute();
      }

      job.retryCount = 0;
      job.executedCount += 1;
    } catch (error) {
      console.error(`Cron job ${job.name ?? job.id} failed.`, error);
      job.retryCount += 1;

      if (job.retryCount > job.maxRetries) {
        return;
      }

      const delay = job.retryInterval * Math.pow(job.backoffFactor, job.retryCount - 1);
      clearRetryTimer(job.id);
      retryTimers.set(
        job.id,
        setTimeout(() => {
          void runJob(job.id);
        }, delay)
      );
    }
  }

  function scheduleJob(jobId: string) {
    const job = jobs.get(jobId);
    if (!job?.isActive) {
      return;
    }

    clearIntervalTimer(jobId);
    intervalTimers.set(
      jobId,
      setInterval(() => {
        void runJob(jobId);
      }, job.interval)
    );
  }

  function addJob(params: CronJobParams) {
    removeJob(params.id);

    const job: CronJobConfig = {
      ...params,
      isActive: true,
      retryCount: 0,
      executedCount: 0,
      maxRetries: params.maxRetries ?? 3,
      retryInterval: params.retryInterval ?? 5000,
      backoffFactor: params.backoffFactor ?? 1
    };

    jobs.set(job.id, job);
    scheduleJob(job.id);

    if (job.immediate) {
      void runJob(job.id);
    }
  }

  function pauseJob(jobId: string) {
    const job = jobs.get(jobId);
    if (!job) {
      return;
    }

    job.isActive = false;
    clearIntervalTimer(jobId);
    clearRetryTimer(jobId);
  }

  function resumeJob(jobId: string) {
    const job = jobs.get(jobId);
    if (!job || job.isActive) {
      return;
    }

    job.isActive = true;
    scheduleJob(jobId);
  }

  function clearAllJobs() {
    [...jobs.keys()].forEach(removeJob);
  }

  window.addEventListener('pagehide', clearAllJobs);

  return {
    jobs,
    addJob,
    removeJob,
    pauseJob,
    resumeJob,
    clearAllJobs,
    runJob
  };
}

export function useCronJobManager() {
  if (!instance) {
    instance = createCronJobManager();
  }

  return instance;
}
