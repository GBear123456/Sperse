/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.component.html',
    styleUrls: [
        '../../assets/fonts/fonts-activ-grotesk.css',
        './dashboard.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
    bankCodeTotalCount$: Observable<string> = this.bankCodeService.bankCodeTotalCount$;
    bankCodesGroupsCountsWithPercents$ = this.bankCodeService.bankCodesGroupsCountsWithPercents$;
    hasSubscription$: Observable<boolean> = this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass);

    constructor(
        private profileService: ProfileService,
        private bankCodeService: BankCodeService,
        public ls: AppLocalizationService
    ) {}
}
