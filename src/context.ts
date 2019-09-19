export class CloudBaseContext {
    public readonly secretId: string
    public readonly secretKey: string
    public readonly token: string
    public readonly envId: string

    constructor({ secretId = '', secretKey = '', token = '' }) {
        this.secretId = secretId
        this.secretKey = secretKey
        this.token = token
    }
}
