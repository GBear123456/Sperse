export class SettingsHelper {
    static getCurrency() : string {
        return abp.setting.get('App.TenantManagement.Currency');
    }
}
