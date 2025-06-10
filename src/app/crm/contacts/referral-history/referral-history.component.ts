import { Component, OnInit } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'referral-history',
    templateUrl: './referral-history.component.html',
    styleUrls: ['./referral-history.component.less']
})
export class ReferralHistoryComponent implements OnInit {
    constructor(
        public ls: AppLocalizationService
    ) {
    }
    ngOnInit() {
    }
}
