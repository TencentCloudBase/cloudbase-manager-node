export { guid6 } from './uuid';
export * from './request';
export * from './auth';
export * from './cloudbaseRequest';
export declare function zipDir(dirPath: any, outputPath: any): Promise<unknown>;
export declare function getRuntime(): string;
export declare function getEnvVar(envName: string): string;
export declare function rsaEncrypt(data: string): string;
