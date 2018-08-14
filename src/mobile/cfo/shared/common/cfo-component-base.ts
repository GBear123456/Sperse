import { AppComponentBase } from '@shared/common/app-component-base';
import { OnInit, OnDestroy, Injector } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InstanceType } from '@shared/service-proxies/service-proxies';
import { CFOService } from '../../cfo.service';
import { AppConsts } from 'shared/AppConsts';

export abstract class CFOComponentBase extends AppComponentBase implements OnInit, OnDestroy {
    instanceId: number;
    instanceType: string;

    protected _route: ActivatedRoute;
    _cfoService: CFOService;

    protected _sub: any;

    constructor(injector: Injector) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;

        this._route = injector.get(ActivatedRoute);
        this._cfoService = injector.get(CFOService);

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
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
        this._sub.unsubscribe();
    }

    getODataUrl(uri: String, filter?: Object) {
        let url = super.getODataUrl(uri, filter);
        url += (url.indexOf('?') == -1 ? '?' : '&');

        if (this.instanceType !== undefined && InstanceType[this.instanceType] !== undefined) {
            url += 'instanceType=' + encodeURIComponent('' + InstanceType[this.instanceType]) + '&';
        }

        if (this.instanceId !== undefined) {
            url += 'instanceId=' + encodeURIComponent('' + this.instanceId) + '&';
        }

        url = url.replace(/[?&]$/, '');

        return url;
    }
}
