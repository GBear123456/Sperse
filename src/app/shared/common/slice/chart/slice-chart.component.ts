/** Core imports */
import { ChangeDetectionStrategy, Component, OnInit, Input } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable } from 'rxjs';
import values from 'lodash/values';
import capitalize from 'lodash/capitalize';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { SummaryBy } from '@app/shared/common/slice/chart/summary-by.enum';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
    selector: 'slice-chart',
    templateUrl: 'slice-chart.component.html',
    styleUrls: [ './slice-chart.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliceChartComponent implements OnInit {
    @Input() dataSource: any;
    @Input() title = '';
    @Input() valueField: string;
    @Input() argumentField: string;
    summaryBy: BehaviorSubject<SummaryBy> = new BehaviorSubject<SummaryBy>(SummaryBy.Month);
    summaryBy$: Observable<SummaryBy> = this.summaryBy.asObservable();
    summaryByList: string[] = values(SummaryBy).map((summaryBy: string) => capitalize(summaryBy));

    constructor(public ls: AppLocalizationService) { }

    ngOnInit() {}

    customizeBottomAxis(elem): string {
        let label: string = elem.value.getFullYear().toString();
        if (this.summaryBy.value === SummaryBy.Quarter) {
            label += '/' + DateHelper.getQuarter(elem.value);
        } else if (this.summaryBy.value === SummaryBy.Month) {
            label += '/' + elem.value.getMonth() + 1;
        }
        return label;
    }
}
