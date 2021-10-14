export declare class CloudBaseContext {
    readonly secretId: string;
    readonly secretKey: string;
    readonly token: string;
    readonly proxy: string;
    readonly envId: string;
    readonly region: string;
    readonly envType: string;
    constructor({ secretId, secretKey, token, proxy, region, envType }: {
        secretId?: string;
        secretKey?: string;
        token?: string;
        proxy?: string;
        region?: string;
        envType?: string;
    });
}
