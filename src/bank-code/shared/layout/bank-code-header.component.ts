/** Core imports */
import { Component } from '@angular/core';
import { Router } from '@angular/router';

/** Application imports */
import { AppConsts } from 'shared/AppConsts';
import { BankCodeLayoutService } from './bank-code-layout.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '../../../app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: 'bank-code-header.component.html',
    styleUrls: [
        'bank-code-header.component.less'
    ],
    selector: 'bank-code-header'
})
export class BankCodeHeaderComponent {
    loggedUserId = abp.session.userId;
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    currentDate = new Date();

    constructor(
        private layoutService: BankCodeLayoutService,
        private router: Router,
        public sessionService: AppSessionService,
        public appSession: AppSessionService,
        public ls: AppLocalizationService
    ) {}

    logoClick() {
        if (this.loggedUserId)
            this.router.navigate(['/code-breaker']);
        else
            location.href = location.origin;
    }
}
