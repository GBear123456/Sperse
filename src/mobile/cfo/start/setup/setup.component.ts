import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AppConsts } from '@shared/AppConsts';
import { InstanceServiceProxy, InstanceType } from 'shared/service-proxies/service-proxies';
import { CFOComponentBase } from '../../shared/common/cfo-component-base';

@Component({
    selector: 'setup',
    templateUrl: './setup.component.html',
    styleUrls: ['./setup.component.less'],
    providers: [InstanceServiceProxy]
})
export class SetupComponent extends CFOComponentBase implements OnInit {
    isDisabled = false;

    constructor(injector: Injector,
        private _instanceServiceProxy: InstanceServiceProxy,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnInit(): void {
        super.ngOnInit();
    }

    onStart(): void {
        this.isDisabled = true;
        this._instanceServiceProxy.setup(InstanceType[this.instanceType]).subscribe((data) => {
            this._cfoService.instanceChangeProcess();
            this._router.navigate(['/app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']);
        });
    }
}
