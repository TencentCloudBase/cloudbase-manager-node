export class CloudBaseContext {
    public readonly secretId: string
    public readonly secretKey: string
    public readonly token: string
    public readonly proxy: string
    public readonly envId: string
    public readonly region: string

    constructor({ secretId = '', secretKey = '', token = '', proxy = '', region = '' }) {
        this.secretId = secretId
        this.secretKey = secretKey
        this.token = token
        this.proxy = proxy
        this.region = region
    }
}
