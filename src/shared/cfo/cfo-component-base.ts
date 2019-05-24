import { AppComponentBase } from '@shared/common/app-component-base';
import { OnDestroy, Injector } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { CFOService } from './cfo.service';

export abstract class CFOComponentBase extends AppComponentBase implements OnDestroy {
    instanceId: number;
    instanceType: string;
    get isInstanceAdmin() {
        return this._cfoService.isInstanceAdmin;
    }
    get isMemberAccessManage() {
        return this._cfoService.isMemberAccessManage;
    }
    _cfoService: CFOService;

    constructor(injector: Injector) {
        super(injector);
        this._cfoService = injector.get(CFOService);

        if (!this._cfoService.hasStaticInstance &&
            this.constructor == this._activatedRoute.component
        ) {
            this._activatedRoute.params.pipe(
                takeUntil(this.destroy$)
            ).subscribe(params => {
                let instance = params['instance'];
                if (!(this.instanceId = parseInt(instance))) {
                    this.instanceId = undefined;
                }
                this.instanceType = this.capitalize(instance);

                if (this.instanceType !== this._cfoService.instanceType
                    || this.instanceId !== this._cfoService.instanceId) {
                    this._cfoService.instanceTypeChanged.next(this.instanceType);
                    this._cfoService.instanceType = this.instanceType;
                    this._cfoService.instanceId = this.instanceId;
                    this._cfoService.instanceChangeProcess();
                }
            });
        } else {
            this.instanceType = this._cfoService.instanceType;
            this.instanceId = this._cfoService.instanceId;
        }
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
