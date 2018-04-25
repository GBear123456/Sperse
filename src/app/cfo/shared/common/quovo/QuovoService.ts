import { Injectable } from '@angular/core';
import { InstanceType, SyncServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

declare const Quovo: any;

export class QuovoHandler {
    handler: any;
    isLoaded = false;
}

@Injectable()
export class QuovoService {
    constructor(
        private _syncServiceProxy: SyncServiceProxy
    ) {}

    getQuovoHandler(instanceType: string, instanceId: number) {
        let quovoHandler = new QuovoHandler();
        jQuery.getScript('https://app.quovo.com/ui.js', () => {
            this._syncServiceProxy.createProviderUIToken(InstanceType[instanceType], instanceId)
                .subscribe((data) => {
                    quovoHandler.handler = this.createQuovoHandler(data.token, () => quovoHandler.isLoaded = true);
                });
        });

        return quovoHandler;
    }

    private createQuovoHandler(token, onLoad) {
        return Quovo.create({
            token: token,
            userCss: AppConsts.appBaseUrl + '/assets/cfo-css/quovo.css',
            search: {
                testInstitutions: true
            },
            onLoad: () => { onLoad(); console.log('loaded'); },
            onAdd: function (err, event) {
                if (!err) {
                    console.log('Connection', event.connection.id, 'added!');
                }
            }
        });
    }

}
