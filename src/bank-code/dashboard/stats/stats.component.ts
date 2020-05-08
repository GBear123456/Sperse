/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { first, skip, map } from 'rxjs/operators';

/** Application imports */
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { AppLocalizationService } from '../../../app/shared/common/localization/app-localization.service';
import { ProfileService } from '../../../shared/common/profile-service/profile.service';

@Component({
    selector: 'stats',
    templateUrl: 'stats.component.html',
    styleUrls: [
        '../../shared/styles/view-more-button.less',
        'stats.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsComponent {
    badgeIconName$: Observable<string> = this.bankCodeService.bankCodeLevel$.pipe(
        skip(1),
        map((level: number) => {
            return (!level ? 1 : level) + '-' + (level === 0 ? '0' : '1');
        })
    );
    noClients$ = this.bankCodeService.getClientsBankCodesTotalCount().pipe(
        map((clientsCount: number) => !clientsCount)
    );
    showAll = false;

    constructor(
        private profileService: ProfileService,
        public bankCodeService: BankCodeService,
        public ls: AppLocalizationService
    ) {}

    decodeFirstCode() {
        this.profileService.trackingLink$.pipe(first()).subscribe(
            (trackingLink: string) => window.open(trackingLink, '_blank')
        );
    }
}