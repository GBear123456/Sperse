import { Injectable, Injector } from '@angular/core';
import { InstanceType, SyncServiceProxy } from '@shared/service-proxies/service-proxies';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppConsts } from '@shared/AppConsts';
import { CFOService } from '@shared/cfo/cfo.service';

declare const Quovo: any;

export class QuovoHandler {
    private handler: any;
    private _token: string;
    private _tokenTime: number;
    private _tokenExpirationTime = 1000 * 60 * 60;
    private addedConnectionIds = [];
    private _isLoaded = false;
    private _isOpened = false;

    private _instanceType: string;
    private _instanceId: number;
    private _createHandlerFunc: Function;
    private _getTokenFunc: Function;
    private _iframe: any;
    private onAdd: Function;

    constructor(instanceType: string, instanceId: number, createQuovoHandlerFunc, onAccountAdd, getTokenFunc) {
        this._instanceType = instanceType;
        this._instanceId = instanceId;
        this._createHandlerFunc = createQuovoHandlerFunc;
        this._getTokenFunc = getTokenFunc;
        this.onAdd = onAccountAdd;
    }

    get instanceType(): string { return this._instanceType; }
    get instanceId(): number { return this._instanceId; }
    get isLoaded(): boolean {
        if (this._isLoaded && !this.isValid) {
            setTimeout(() => this.reconnect(), 100);
            return false;
        }

        return this._isLoaded;
    }
    get isOpened(): boolean { return this._isOpened; }

    onClose: Function;

    connect() {
        this._getTokenFunc(this, (token) => this.createHandler(token));
    }

    get isValid() {
        return Date.now() - this._tokenTime < this._tokenExpirationTime;
    }

    private set token($token) {
        this._token = $token;
        this._tokenTime = Date.now();
    }

    private get token() { return this._token; }

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

    private createHandler(token) {
        this.token = token;
        this.handler = this._createHandlerFunc(token,
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

        if (this._iframe) {
            this._getTokenFunc(this, (newToken) => {
                let src = this._iframe.getAttribute('src');
                src = src.replace(this.token, newToken);
                this.token = newToken;
                this._iframe.setAttribute('src', 'about:blank');
                this._iframe.setAttribute('src', src);
            });
        } else {
            this.connect();
        }
    }

    private onHandlerLoad() {
        this._isLoaded = true;

        if (!this._iframe) {
            let frames = document.querySelectorAll('[id|=q-frame]');
            if (frames.length === 0) {
                this._iframe = null;
            } else {
                this._iframe = frames[frames.length - 1];
            }
        }
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
    _permissionChecker: PermissionCheckerService;

    constructor(
        injector: Injector,
        private _syncService: SyncServiceProxy,
    ) {
        this._cfoService = injector.get(CFOService);
        this._permissionChecker = injector.get(PermissionCheckerService);
    }

    private quovoHandlers: { [id: string]: QuovoHandler } = {};

    getQuovoHandler(instanceType: string, instanceId: number) {
        let handlerId = instanceType + instanceId;
        let quovoHandler = this.quovoHandlers[handlerId];
        if (!quovoHandler && (instanceType == InstanceType.User || !isNaN(parseInt(instanceType)) || 
            (instanceType == InstanceType.Main && this._permissionChecker.isGranted('Pages.CFO.MainInstanceAdmin')))
        ) {
            quovoHandler = new QuovoHandler(instanceType, instanceId,
                (token, onLoad, onOpen, onClose, onAdd) => this.createQuovoHandler(token, onLoad, onOpen, onClose, onAdd),
                (_instanceType, _instanceId, _id) => this.onAccountAdd(_instanceType, _instanceId, _id),
                (handler, callback) => this.getUIToken(handler, callback));
            this.quovoHandlers[handlerId] = quovoHandler;

            jQuery.getScript('https://app.quovo.com/ui.js', () => {
                quovoHandler.connect();
            });
        }

        return quovoHandler;
    }

    public getUIToken(quovoHandler: QuovoHandler, callback) {
        this._syncService.createProviderUIToken(InstanceType[quovoHandler.instanceType], quovoHandler.instanceId, 'Q')
            .subscribe((data) => callback(data.token));
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
            topInstitutions: 'all',
            confirmClose: false,
            search: {
                testInstitutions: true
            },
            onLoad: () => { onLoad(); },
            onAdd: function (err, event) {
                if (!err) {
                    onAdd(event.connection.id);
                }
            },
            onClose: () => onClose()
        });
    }
}
