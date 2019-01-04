import {Component, OnInit, Injector} from '@angular/core';
import {appModuleAnimation} from '@shared/animations/routerTransition';
import {AppComponentBase} from '@shared/common/app-component-base';

@Component({
    selector: 'app-credit-resources',
    templateUrl: './credit-resources.component.html',
    styleUrls: ['./credit-resources.component.less'],
    animations: [appModuleAnimation()]
})
export class CreditResourcesComponent extends AppComponentBase implements OnInit {

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }

}
