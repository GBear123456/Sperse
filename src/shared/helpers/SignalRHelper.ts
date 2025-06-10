import { UtilsService } from 'abp-ng2-module';
import { AppConsts } from '@shared/AppConsts';

export class SignalRHelper {
    static initSignalR(callback: () => void): void {

        let encryptedAuthToken = new UtilsService().getCookieValue(AppConsts.authorization.encrptedAuthTokenName);

        abp.signalr = {
            autoConnect: true,
            connect: undefined,
            hubs: undefined,
            qs: AppConsts.authorization.encrptedAuthTokenName + '=' + encodeURIComponent(encryptedAuthToken),
            remoteServiceBaseUrl: AppConsts.remoteServiceBaseUrl,
            startConnection: undefined,
            url: '/signalr'
        };

        jQuery.getScript(AppConsts.appBaseHref + 'assets/abp/abp.signalr-client.js', () => {
            callback();
        });
    }
}
