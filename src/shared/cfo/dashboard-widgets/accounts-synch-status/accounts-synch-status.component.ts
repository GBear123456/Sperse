import {Component, Injector, OnInit} from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

@Component({
    selector: 'app-accounts-synch-status',
    templateUrl: './accounts-synch-status.component.html',
    styleUrls: ['./accounts-synch-status.component.less']
})
export class AccountsSynchStatusComponent extends CFOComponentBase implements OnInit {
    accountsSynchData = [
        {accName: 'Bank of America', progress: 100, isDone: true},
        {accName: 'Merrill Lynch', progress: 68, isDone: false},
        {accName: 'City Bank', progress: 23, isDone: false}
    ];

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit() {
    }

}
