import { Environment } from '../environment';
import { EndUserInfo } from './types';
export declare class UserService {
    private environment;
    private tcbService;
    constructor(environment: Environment);
    getEndUserList(options: {
        limit: number;
        offset: number;
    }): Promise<{
        Total: number;
        Users: EndUserInfo[];
        RequestId: string;
    }>;
    disableEndUser(options: {
        uuid: string;
    }): Promise<{
        RequestId: string;
    }>;
    deleteEndUsers(options: {
        userList: string[];
    }): Promise<{
        RequestId: string;
    }>;
}
