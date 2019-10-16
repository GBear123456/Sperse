/** Core imports */
import { OnDestroy, Injector } from '@angular/core';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { InstanceType } from '@shared/service-proxies/service-proxies';
import { CFOService } from './cfo.service';

export abstract class CFOComponentBase extends AppComponentBase implements OnDestroy {
    instanceId: number;
    instanceType: InstanceType;
    get isInstanceAdmin() {
        return this._cfoService.isInstanceAdmin;
    }
    get isMemberAccessManage() {
        return this._cfoService.isMemberAccessManage;
    }
    _cfoService: CFOService;
    instanceUri: string;

    constructor(injector: Injector) {
        super(injector);
        this._cfoService = injector.get(CFOService);

        this.updateInstance();
    }

    updateInstance() {
        this.instanceType = this._cfoService.instanceType;
        this.instanceId = this._cfoService.instanceId;
        this.updateInstanceUri();
    }

    updateInstanceUri() {
        this.instanceUri = (/\/app\/([\w,-]+)[\/$]?/.exec(location.pathname) || location.pathname.split('/').filter(Boolean)).shift() +
            (this._cfoService.hasStaticInstance ? '' : (this.instanceType || this.instanceId.toString() || '').toLowerCase());
    }

    getODataUrl(uri: string, filter?: Object) {
        return super.getODataUrl(uri, filter, {
            instanceType: this.instanceType,
            instanceId: this.instanceId
        });
    }

    processODataFilter(grid, uri, filters, getCheckCustom) {
        return super.processODataFilter(grid, uri, filters, getCheckCustom, {
            instanceType: this.instanceType,
            instanceId: this.instanceId
        });
    }

    ngOnDestroy() {
        super.ngOnDestroy();
    }
}
