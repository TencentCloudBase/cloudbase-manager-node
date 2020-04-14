"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 异步任务并发控制器，以一定的并发数执行所有任务
 * 不具备队列性质，异步任务随机执行
 * 单个任务异常，错误会返回，单不会退出执行
 * 所有任务执行
 */
class AsyncTaskParallelController {
    constructor(maxParallel, checkInterval = 20) {
        this.tasks = [];
        this.maxParallel = maxParallel;
        this.checkInterval = checkInterval;
    }
    loadTasks(tasks) {
        this.tasks.push(...tasks);
        this.totalTasks = this.tasks.length;
    }
    push(task) {
        this.tasks.push(task);
        this.totalTasks = this.tasks.length;
    }
    // 开始执行任务
    async run() {
        // 存储任务执行结果
        const results = [];
        // 标志任务是否执行过
        const tasksDone = [];
        // 当前正在运行的任务数量
        let runningTask = 0;
        return new Promise((resolve) => {
            // 使用定时器，不阻塞线程
            const timer = setInterval(() => {
                // 全部任务运行完成
                if (runningTask === 0 && tasksDone.length === this.totalTasks) {
                    clearInterval(timer);
                    resolve(results);
                }
                // 当前运行任务数超过最大并发，不再执行新的任务
                if (runningTask >= this.maxParallel) {
                    return;
                }
                // 遍历任务列表，开始执行还没有执行的任务
                this.tasks.forEach((task, index) => {
                    if (!tasksDone[index] && runningTask < this.maxParallel) {
                        runningTask++;
                        task()
                            .then((res) => {
                            results[index] = res;
                        })
                            .catch((err) => {
                            results[index] = err;
                        })
                            .finally(() => {
                            runningTask--;
                            tasksDone[index] = 1;
                        });
                    }
                });
            }, this.checkInterval);
        });
    }
}
exports.AsyncTaskParallelController = AsyncTaskParallelController;
