/** Core imports */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

/** Third party imports */
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import * as moment from 'moment';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    templateUrl: './bank-code-layout.component.html',
    styleUrls: [
        './bank-code-dialog.component.less',
        './bank-code-layout.component.less',
        '../../../shared/aviano-sans-font.less'
    ]
})
export class BankCodeLayoutComponent implements OnInit {
    currentYear: number = moment().year();
    tenantName = this.appSession.tenantName || AppConsts.defaultTenantName;
    remoteServiceBaseUrl = AppConsts.remoteServiceBaseUrl;
    originUrl = location.origin;
    isExtPage$: Observable<boolean> = this.activatedRoute.queryParamMap.pipe(
        map((paramsMap: ParamMap) => {
            return paramsMap.get('extlogin') == 'true';
        })
    );

    constructor(
        private activatedRoute: ActivatedRoute,
        private appSession: AppSessionService
    ) {}

    ngOnInit(): void {
    }

    crackMyCode() {
        const link = location.href.indexOf('successfactory.com') >= 0
            ? 'https://sf.crackmycode.com'
            : 'https://crackmycode.com';
        window.open(link);
    }
}
