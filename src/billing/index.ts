import { CloudService } from '../utils'
import { CloudBaseContext } from '../context'
import { IServiceVersion, IGoodItem, IGenerateDealsRes, IPayDealsRes } from '../interfaces'

export class BillingService {
    static billServiceVersion: IServiceVersion = {
        service: 'billing',
        version: '2018-07-09'
    }
    private billService: CloudService

    constructor(context: CloudBaseContext) {
        this.billService = new CloudService(
            context,
            BillingService.billServiceVersion.service,
            BillingService.billServiceVersion.version
        )
    }

    /**
     * 创建订单
     * @param {Array<IGoodItem>} goods
     * @returns {Promise<IGenerateDealsRes>}
     * @memberof BillingService
     */
    public async GenerateDeals(goods: Array<IGoodItem>): Promise<IGenerateDealsRes> {
        return this.billService.request<IGenerateDealsRes>('GenerateDeals', {
            Goods: goods
        })
    }

    /**
     * 支付订单
     * @param {Array<string>} orderIds
     * @returns {Promise<IPayDealsRes>}
     * @memberof BillingService
     */
    public async PayDeals(orderIds: Array<string>): Promise<IPayDealsRes> {
        return this.billService.request<IPayDealsRes>('PayDeals', {
            OrderIds: orderIds
        })
    }
}
