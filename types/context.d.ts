export declare class CloudBaseContext {
    readonly secretId: string;
    readonly secretKey: string;
    readonly token: string;
    readonly envId: string;
    constructor({ secretId, secretKey, token }: {
        secretId?: string;
        secretKey?: string;
        token?: string;
    });
}
