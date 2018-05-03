import { Injectable, Injector } from '@angular/core';
import { InstanceType, SyncServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { CFOService } from '@shared/cfo/cfo.service';

declare const Quovo: any;

export class QuovoHandler {
    private handler: any;
    private addedConnectionIds = [];
    private _isLoaded = false;
    private _isOpened = false;

    private _instanceType: string;
    private _instanceId: number;
    private _connectFunc: Function;
    private onAdd: Function;

    constructor(instanceType: string, instanceId: number, connectFunc, onAccountAdd) {
        this._instanceType = instanceType;
        this._instanceId = instanceId;
        this._connectFunc = connectFunc;
        this.onAdd = onAccountAdd;
    }

    get instanceType(): string { return this._instanceType; }
    get instanceId(): number { return this._instanceId; }
    get isLoaded(): boolean { return this._isLoaded; }
    get isOpened(): boolean { return this._isOpened; }

    onClose: Function;

    connect() {
        this._connectFunc(this);
    }

    open(onClose: Function = null, connectionId: number = null) {
        if (!this.isLoaded || this.isOpened) { return; }

        this.onClose = onClose;
        this.addedConnectionIds.length = 0;
        try {
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
        } catch (err) {
            if (err instanceof Quovo.TokenError) {
                console.log('Quovo.TokenError', err, 'reconnecting...');
                this.reconnect();
            } else if (err instanceof Quovo.EventOriginError) {
                console.log('Quovo.EventOriginError', err, 'reconnecting...');
                this.reconnect();
            } else if (err instanceof Quovo.ConnectError) {
                console.error('Quovo.ConnectError', err);
            } else {
                console.error('non-Connect related error', err);
            }
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

    private reconnect() {
        this._isLoaded = false;
        if (this.isOpened) {
            this._isOpened = false;
            this.close();
        }
        this.handler = null;
        this.connect();
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
        if (this.onAdd) {
            this.onAdd(this._instanceType, this._instanceId, id);
        }
    }
}

@Injectable()
export class QuovoService {
    _cfoService: CFOService;

    constructor(
        injector: Injector,
        private _syncService: SyncServiceProxy,
    ) {
        this._cfoService = injector.get(CFOService);
    }

    private quovoHandlers: { [id: string]: QuovoHandler } = {};

    getQuovoHandler(instanceType: string, instanceId: number) {
        let handlerId = instanceType + instanceId;
        console.log(handlerId);
        let quovoHandler = this.quovoHandlers[handlerId];

        if (!quovoHandler) {
            quovoHandler = new QuovoHandler(instanceType, instanceId,
                (handler) => this.connect(handler),
                (_instanceType, _instanceId, _id) => this.onAccountAdd(_instanceType, _instanceId, _id));
            this.quovoHandlers[handlerId] = quovoHandler;

            jQuery.getScript('https://app.quovo.com/ui.js', () => {
                this.connect(quovoHandler);
            });
        }

        return quovoHandler;
    }

    public connect(quovoHandler: QuovoHandler) {
        this._syncService.createProviderUIToken(InstanceType[quovoHandler.instanceType], quovoHandler.instanceId)
            .subscribe((data) => {
                quovoHandler.createHandler(this.createQuovoHandler, data.token);
            });
    }

    private onAccountAdd(instanceType: string, instanceId: number, accountId) {
        this._syncService.syncAllAccounts(InstanceType[instanceType], instanceId, true, true)
            .subscribe(() => {
                if (this._cfoService.instanceType === instanceType && this._cfoService.instanceId === instanceId) {
                    this._cfoService.instanceChangeProcess();
                }
            });
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
