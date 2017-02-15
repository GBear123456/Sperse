import { AppConsts} from '@shared/AppConsts';

export class SignalRHelper {
    static initSignalR(callback: () => void): void {
        jQuery.getScript(AppConsts.remoteServiceBaseUrl + '/signalr/hubs', () => {

            $.connection.hub.url = AppConsts.remoteServiceBaseUrl + "/signalr";
            $.connection.hub.qs = "auth_token=" + encodeURIComponent(abp.utils.truncateString(abp.auth.getToken(), 64));

            jQuery.getScript(AppConsts.appBaseUrl + '/assets/temp/abp.signalr.js');

            callback();
        });
    }
}