import { CFOComponentBase } from "@app/cfo/shared/common/cfo-component-base";
import { Component, OnInit, Injector } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AppConsts } from "shared/AppConsts";
import { appModuleAnimation } from "shared/animations/routerTransition";

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
    animations: [appModuleAnimation()]
})
export class DashboardComponent extends CFOComponentBase implements OnInit {
    public headlineConfig;

    constructor(injector: Injector,
        route: ActivatedRoute
    ) {
        super(injector, route);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit(): void {
        super.ngOnInit();

        this.headlineConfig = {
            names: [this.l('Dashboard_Title')],
            iconSrc: 'assets/common/icons/manage-icon.svg',
            buttons: []
        }
    }
}
