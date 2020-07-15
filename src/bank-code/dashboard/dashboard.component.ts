/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Third party imports */
import { Observable, zip } from 'rxjs';
import { map } from 'rxjs/operators';

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
    contactBankCodesGroupsCountsWithPercents$ = this.bankCodeService.contactBankCodesGroupsCountsWithPercents$;
    allBankCodesGroupsCountsWithPercents$ = this.bankCodeService.allBankCodesGroupsCountsWithPercents$;
    contactBankCodeTotalCount$: Observable<string> = this.bankCodeService.contactBankCodeTotalCount$;
    allBankCodeTotalCount$: Observable<string> = this.bankCodeService.allBankCodeTotalCount$;
    hasSubscription$: Observable<boolean> =
        zip(
            this.profileService.checkServiceSubscription(BankCodeServiceType.BANKPass),
            this.profileService.checkServiceSubscription(BankCodeServiceType.Connect)
        ).pipe(
            map((res: boolean[]) => res.some(Boolean))
        )

    constructor(
        private profileService: ProfileService,
        private bankCodeService: BankCodeService,
        public ls: AppLocalizationService
    ) {}
}
