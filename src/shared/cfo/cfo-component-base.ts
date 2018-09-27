import { AppComponentBase } from '@shared/common/app-component-base';
import { OnInit, OnDestroy, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { InstanceType } from '@shared/service-proxies/service-proxies';
import { CFOService } from './cfo.service';
import { AppConsts } from '@shared/AppConsts';

export abstract class CFOComponentBase extends AppComponentBase implements OnInit, OnDestroy {
    instanceId: number;
    instanceType: string;
    get isInstanceAdmin() {
        return (this.instanceType == InstanceType.User) || !isNaN(parseInt(this.instanceType)) || 
            (this.instanceType == InstanceType.Main && this.permission.isGranted('Pages.CFO.MainInstanceAdmin'));
    }
    get componentIsActivated(): boolean {
        return this._route['_routerState'].snapshot.url === this._router.url;
    }
    protected _route: ActivatedRoute;
    protected _router: Router;
    _cfoService: CFOService;

    private _sub: any;

    constructor(injector: Injector) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;

        this._route = injector.get(ActivatedRoute);
        this._router = injector.get(Router);
        this._cfoService = injector.get(CFOService);

        if (this.constructor == this._route.component)
            this._sub = this._route.params.subscribe(params => {
                let instance = params['instance'];
                if (!(this.instanceId = parseInt(instance))) {
                    this.instanceId = undefined;
                }
                this.instanceType = this.capitalize(instance);

                if (this.instanceType !== this._cfoService.instanceType
                    || this.instanceId !== this._cfoService.instanceId) {
                    this._cfoService.instanceType = this.instanceType;
                    this._cfoService.instanceId = this.instanceId;
                    this._cfoService.instanceChangeProcess();
                }
            });
        else {
            this.instanceType = this._cfoService.instanceType;
            this.instanceId = this._cfoService.instanceId;
        }
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
        if (this._sub)
            this._sub.unsubscribe();
    }

    getODataUrl(uri: String, filter?: Object) {
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
}
