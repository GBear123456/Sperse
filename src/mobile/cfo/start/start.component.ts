import { Injector, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { CFOComponentBase } from '../shared/common/cfo-component-base';
import { SetupComponent } from './setup/setup.component';

@Component({
    selector: 'start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.less'],
    animations: [appModuleAnimation()]
})
export class StartComponent extends CFOComponentBase implements OnInit {
    constructor(
        injector: Injector,
        private _router: Router) {
            super(injector);
    }

    ngOnInit() {
        super.ngOnInit();

        if (this._cfoService.initialized === true) {
            this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/linkaccounts']);
        }
    }
}
