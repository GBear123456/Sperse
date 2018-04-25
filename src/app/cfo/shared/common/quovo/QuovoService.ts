import { Injectable } from '@angular/core';
import { InstanceType, SyncServiceProxy } from '@shared/service-proxies/service-proxies';

declare const Quovo: any;

export class QuovoHandler {
    handler: any;
    isLoaded = false;
    isOpened = false;
    addedConnections = [];
}

@Injectable()
export class QuovoService {
    constructor(
        private _syncServiceProxy: SyncServiceProxy
    ) {}

    getQuovoHandler(instanceType: string, instanceId: number, onClose?: Function) {
        let quovoHandler = new QuovoHandler();
        jQuery.getScript('https://app.quovo.com/ui.js', () => {
            this._syncServiceProxy.createProviderUIToken(InstanceType[instanceType], instanceId)
                .subscribe((data) => {
                    quovoHandler.handler = this.createQuovoHandler(data.token,
                        () => quovoHandler.isLoaded = true,
                        () => quovoHandler.isOpened = true,
                        () => {
                            quovoHandler.isOpened = false;
                            if (onClose) onClose();
                        },
                        (id) => quovoHandler.addedConnections.push(id));
                });
        });

        return quovoHandler;
    }

    private createQuovoHandler(token, onLoad, onOpen, onClose, onAdd) {
        return Quovo.create({
            token: token,
            search: {
                testInstitutions: true
            },
            onLoad: () => { onLoad(); console.log('loaded'); },
            onAdd: function (err, event) {
                onAdd();
                if (!err) {
                    console.log('Connection', event.connection.id, 'added!');
                }
            },
            onClose: () => onClose()
        });
    }

}
