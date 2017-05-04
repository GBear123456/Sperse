import { Component, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    templateUrl: './side-bar.component.html',
	styleUrls: ['./side-bar.component.less'],
    selector: 'side-bar'
})
export class SideBarComponent extends AppComponentBase {

    constructor(injector: Injector) {
        super(injector);
    }
    

}