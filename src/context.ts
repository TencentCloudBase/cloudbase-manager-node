export class CloudBaseContext {
    public readonly secretId: string
    public readonly secretKey: string
    public readonly token: string
    public readonly proxy: string
    public readonly envId: string
    public readonly region: string
    public readonly envType: string // baas/run/weda/hosting

    constructor({ secretId = '', secretKey = '', token = '', proxy = '', region = '', envType = '' }) {
        this.secretId = secretId
        this.secretKey = secretKey
        this.token = token
        this.proxy = proxy
        this.region = region
        this.envType = envType
    }
}
