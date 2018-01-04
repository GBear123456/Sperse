import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { SetupStepComponent } from '../../shared/setup-steps/setup-steps.component';
import { ActivatedRoute, Router } from '@angular/router';
import { InstanceServiceProxy, InstanceType48 } from 'shared/service-proxies/service-proxies';
import { AppService } from 'app/app.service';

@Component({
    selector: 'setup',
    templateUrl: './setup.component.html',
    styleUrls: ['./setup.component.less'],
    animations: [appModuleAnimation()],
    providers: [InstanceServiceProxy]
})
export class SetupComponent extends CFOComponentBase implements OnInit {
    public headlineConfig;

    constructor(injector: Injector,
        route: ActivatedRoute,
        private _appService: AppService,
        private _instanceServiceProxy: InstanceServiceProxy,
        private _router: Router
    ) {
        super(injector, route);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.headlineConfig = { 
            names: [this.l('Setup_Title')], 
            iconSrc: 'assets/common/icons/magic-stick-icon.svg',
            buttons: []
        }
    }

    onStart(): void {
        this._instanceServiceProxy.setup(InstanceType48[this.instanceType]).subscribe((data) => {
            this._appService.topMenu.items[0].text = this.l('Dashboard');
            this._router.navigate(['/app/cfo/' + this.instanceType.toLowerCase() + '/bank-accounts']);
        });
    }
}
