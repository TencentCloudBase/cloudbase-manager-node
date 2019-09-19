export declare class FunctionsCode {
    envId: string;
    constructor(envId: string);
    update(name: any, runtime: string, handler: string, rootPath: string, base64Code?: string): Promise<void>;
}
