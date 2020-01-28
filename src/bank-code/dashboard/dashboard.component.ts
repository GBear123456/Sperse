/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankCodeService } from '@app/shared/common/bank-code/bank-code.service';
import values from 'lodash/values';

@Component({
    selector: 'dashboard',
    templateUrl: 'dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
    bankCodeLevel$: Observable<number> = this.bankCodeService.bankCodeLevel$;
    bankCodeGroupsCounts$: Observable<number[]> = this.bankCodeService.getAvailableBankCodes().pipe(
        map((bankCodes: { [bankCode: string]: number }) => {
            let bankCodeGroups = {
                'B': 0,
                'A': 0,
                'N': 0,
                'K': 0
            };
            for (let bankCode in bankCodes) {
                bankCodeGroups[bankCode[0]] += bankCodes[bankCode];
            }
            return values(bankCodeGroups);
        })
    );
    bankCodeTotalCount$: Observable<string> = this.bankCodeService.bankCodeClientsCount$.pipe(
        map((count) => count.toString())
    );
    bankCodesGroupsCountsWithPercents$ = this.bankCodeGroupsCounts$.pipe(
        withLatestFrom(this.bankCodeTotalCount$),
        map(([bankCodeGroupsCounts, total]: [number[], string]) => {
            return bankCodeGroupsCounts.map((groupCount: number) => ({
                percent: +total ? groupCount / (+total) * 100 : 0,
                count: groupCount
            }));
        })
    );

    constructor(
        public bankCodeService: BankCodeService,
        public ls: AppLocalizationService
    ) {}
}
