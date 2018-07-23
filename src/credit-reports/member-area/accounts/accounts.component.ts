import { Component, OnInit, Injector } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import * as _ from 'underscore';

import { } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './accounts.component.html',
    providers: [],
    styleUrls: ['./accounts.component.less']
})
export class AccountsComponent extends AppComponentBase implements OnInit {

    constructor(
        injector: Injector,
    ) {
        super(injector, AppConsts.localization.CreditReportLocalizationSourceName);
    }

    ngOnInit() {
    }
}
