/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { filter, skip, map } from 'rxjs/operators';

/** Application imports */
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import { AppLocalizationService } from '../../../app/shared/common/localization/app-localization.service';

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
        filter(Boolean),
        map((level: number) => {
            return (level === 0 ? 1 : level) + '-' + (level === 0 ? '0' : '1');
        })
    );
    noClients$ = this.bankCodeService.getClientsBankCodesTotalCount().pipe(
        map((clientsCount: number) => !clientsCount)
    );
    showAll = false;

    constructor(
        public bankCodeService: BankCodeService,
        public ls: AppLocalizationService
    ) {}

    decodeFirstCode() {

    }
}