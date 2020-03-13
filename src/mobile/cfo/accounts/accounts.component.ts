import { Component, OnInit, Injector } from '@angular/core';
import { CFOComponentBase } from '../shared/common/cfo-component-base';

@Component({
    selector: 'accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less']
})
export class AccountsComponent extends CFOComponentBase implements OnInit  {
    sourceUrl: any;

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit() {
    }
}
