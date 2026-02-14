/** @format */

export class AsyncQueue {
  private tasks: {
    task: () => Promise<unknown>;
    res: (value: unknown) => void;
    rej: (value: unknown) => void;
  }[] = [];
  private running = 0;
  private maxConcurrency: number;

  constructor(maxConcurrency = 1) {
    this.maxConcurrency = maxConcurrency;
  }

  push(task: () => Promise<unknown>) {
    return new Promise((res, rej) => {
      this.tasks.push({ task, res, rej });
      this.runNext();
    });
  }

  private async runNext() {
    if (this.running >= this.maxConcurrency || this.tasks.length === 0) {
      return;
    }

    this.running++;
    const task = this.tasks.shift()!;

    try {
      const value = await task.task();
      task.res(value);
    } catch (err) {
      task.rej(err);
    } finally {
      this.running--;
      this.runNext();
    }
  }
}
