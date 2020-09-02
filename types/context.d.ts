export declare class CloudBaseContext {
    readonly secretId: string;
    readonly secretKey: string;
    readonly token: string;
    readonly proxy: string;
    readonly envId: string;
    readonly region: string;
    constructor({ secretId, secretKey, token, proxy, region }: {
        secretId?: string;
        secretKey?: string;
        token?: string;
        proxy?: string;
        region?: string;
    });
}
