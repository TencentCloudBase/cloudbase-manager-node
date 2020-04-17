export declare type AsyncTask = () => Promise<any>;
/**
 * 异步任务并发控制器，以一定的并发数执行所有任务
 * 不具备队列性质，异步任务随机执行
 * 单个任务异常，错误会返回，单不会退出执行
 * 所有任务执行
 */
export declare class AsyncTaskParallelController {
    maxParallel: number;
    tasks: AsyncTask[];
    checkInterval: number;
    totalTasks: number;
    constructor(maxParallel: number, checkInterval?: number);
    loadTasks(tasks: AsyncTask[]): void;
    push(task: AsyncTask): void;
    run(): Promise<any[]>;
}
