import { Injectable } from '@angular/core';
import { InstanceType, SyncServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

declare const Quovo: any;

export class QuovoHandler {
    private handler: any;
    private addedConnectionIds = [];
    private _isLoaded = false;
    private _isOpened = false;

    get isLoaded(): boolean { return this._isLoaded; }
    get isOpened(): boolean { return this._isOpened; }

    onClose: Function;

    open(onClose: Function = null, connectionId: number = null) {
        if (!this.isLoaded || this.isOpened) { return; }

        this.onClose = onClose;
        this.addedConnectionIds.length = 0;
        if (connectionId) {
            if (typeof (connectionId) !== 'number') {
                connectionId = parseInt(connectionId);
            }

            this.handler.open(
                {
                    connectionId: connectionId
                });

        } else {
            this.handler.open();
        }
    }

    close() {
        this.handler.close();
    }

    createHandler(createHandlerFunction, token) {
        this.handler = createHandlerFunction(token,
            () => this.onHandlerLoad(),
            () => this.onHandlerOpen(),
            () => this.onHandlerClose(),
            (id) => this.onHandlerConnectionAdd(id));
    }

    private onHandlerLoad() {
        this._isLoaded = true;
    }

    private onHandlerOpen() {
        this._isOpened = true;
    }

    private onHandlerClose() {
        if (this.onClose) {
            this.onClose({
                addedIds: this.addedConnectionIds
            });
        }
        this.addedConnectionIds.length = 0;
        this._isOpened = false;
    }

    private onHandlerConnectionAdd(id) {
        this.addedConnectionIds.push(id);
    }
}

@Injectable()
export class QuovoService {
    constructor(
        private _syncServiceProxy: SyncServiceProxy
    ) {}

    private quovoHandlers: { [id: string]: QuovoHandler } = {};

    getQuovoHandler(instanceType: string, instanceId: number) {
        let handlerId = instanceType + instanceId;
        let quovoHandler = this.quovoHandlers[handlerId];

        if (!quovoHandler) {
            quovoHandler = new QuovoHandler();
            this.quovoHandlers[handlerId] = quovoHandler;

            jQuery.getScript('https://app.quovo.com/ui.js', () => {
                this._syncServiceProxy.createProviderUIToken(InstanceType[instanceType], instanceId)
                    .subscribe((data) => {
                        quovoHandler.createHandler(this.createQuovoHandler, data.token);
                    });
            });
        }

        return quovoHandler;
    }

    private createQuovoHandler(token, onLoad, onOpen, onClose, onAdd) {
        return Quovo.create({
            token: token,
            userCss: AppConsts.appBaseUrl + '/assets/cfo-css/quovo.css',
            search: {
                testInstitutions: true
            },
            onLoad: () => { onLoad(); console.log('loaded'); },
            onAdd: function (err, event) {
                if (!err) {
                    onAdd(event.connection.id);
                    console.log('Connection', event.connection.id, 'added!');
                }
            },
            onClose: () => onClose()
        });
    }
}
