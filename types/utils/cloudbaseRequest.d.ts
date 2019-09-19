export declare class CloudBaseRequest {
    private config;
    constructor(config: {
        envId: string;
        secretId: string;
        secretKey: string;
        token?: string;
        timeout?: number;
    });
    send(api: any, data: any): Promise<any>;
}
export declare function cloudBaseRequest(options: {
    config: {
        envId: string;
        secretId: string;
        secretKey: string;
        token?: string;
        timeout?: number;
    };
    params: Record<string, any>;
    method?: string;
    headers?: Record<string, any>;
}): Promise<any>;
