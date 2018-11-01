import {Component, Injector, OnInit} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'app-root',
    templateUrl: 'credit-report.component.html',
    styleUrls: ['credit-report.component.less']
})

export class CreditReportComponent extends AppComponentBase implements OnInit {
    constructor(
        injector: Injector
    ) {
        super(injector);

        if (abp.session.userId) {
            this._router.navigate(['personal-finance/member-area']);
        }
    }

    ngOnInit() {    }
}
