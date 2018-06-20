export class UserHelper {

    static getShownUserName(userName: string, userTenantId: number, userTenancyName: string) {
        if (!abp.multiTenancy.isEnabled) {
            return userName;
        }

        return userTenantId == abp.session.tenantId ?
            userName :
            (userTenantId ? userTenancyName : '.') + '\\' + userName;
    }
}
