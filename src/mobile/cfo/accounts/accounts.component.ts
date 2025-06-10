import { Component, Injector } from '@angular/core';
import { CFOComponentBase } from '../shared/common/cfo-component-base';

@Component({
    selector: 'accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less']
})
export class AccountsComponent extends CFOComponentBase {
    sourceUrl: any;

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

}
