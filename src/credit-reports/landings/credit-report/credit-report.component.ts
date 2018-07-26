import {Component, Injector, OnInit} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: 'credit-report.component.html',
    styleUrls: ['credit-report.component.less']
})

export class CreditReportComponent extends AppComponentBase implements OnInit {
    constructor(
        injector: Injector,
        private _router: Router
    ) {
        super(injector);

        if (abp.session.userId) {
            this._router.navigate(['credit-reports/member-area']);
        }
    }

    ngOnInit() {    }
}
