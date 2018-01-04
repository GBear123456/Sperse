import { CFOComponentBase } from "@app/cfo/shared/common/cfo-component-base";
import { Injector, Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { SetupComponent } from './setup/setup.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { InstanceServiceProxy, InstanceType46, GetStatusOutputStatus } from "@shared/service-proxies/service-proxies";
import { AppService } from "app/app.service";
import { AppConsts } from "shared/AppConsts";

@Component({
    selector: 'start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.less'],
    animations: [appModuleAnimation()],
    providers: [InstanceServiceProxy]
})
export class StartComponent extends CFOComponentBase implements OnInit {
    isInitialized: boolean = undefined;

    constructor(injector: Injector,
        route: ActivatedRoute,
        private _appService: AppService,
        private _instanceServiceProxy: InstanceServiceProxy
    ) {
        super(injector, route);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    loadData() {
        this._instanceServiceProxy.getStatus(InstanceType46[this.instanceType]).subscribe((data) => {
            this.isInitialized = data.status == GetStatusOutputStatus.Active;

            let setupItem = this._appService.topMenu.items[0];
            setupItem.text = this.l(this.isInitialized ? 'Dashboard' : 'Setup');
            setupItem.visible = true;
        });
    }
}
