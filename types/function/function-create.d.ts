import { ICreateFunctionOptions } from '../interfaces';
export declare class FunctionCreate {
    private cloudService;
    private functionTrigger;
    private extraParams;
    constructor(cloudService: any);
    createFunction(options: ICreateFunctionOptions): Promise<void>;
    batchCreateFunctions(options: ICreateFunctionOptions): Promise<void>;
    updateFunctionCode(options: ICreateFunctionOptions): Promise<void>;
}
