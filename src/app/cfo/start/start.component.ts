import { CFOComponentBase } from "@app/cfo/shared/common/cfo-component-base";
import { Injector, Component } from "@angular/core";
import { SetupComponent } from './setup/setup.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { appModuleAnimation } from "@shared/animations/routerTransition";

@Component({
    selector: 'start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.less'],
    animations: [appModuleAnimation()]
})
export class StartComponent extends CFOComponentBase {
    constructor(injector: Injector) {
        super(injector);
    }
}
