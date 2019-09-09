import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CreditReportDto, CreditScoreRank } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-credit-scores',
    templateUrl: './credit-scores.component.html',
    styleUrls: ['./credit-scores.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditScoresComponent {

    @Input() creditReport: CreditReportDto;

    constructor(
        public ls: AppLocalizationService
    ) {
    }

    getScoreColor(score: CreditScoreRank): string {
        switch (score) {
            case CreditScoreRank.Excellent:
                return '#48dc8e';
            case CreditScoreRank.Good:
                return '#e8da51';
            case CreditScoreRank.Fair:
                return '#f5a623';
            case CreditScoreRank.Poor:
            default:
                return '#e0533b';
        }
    }
}
