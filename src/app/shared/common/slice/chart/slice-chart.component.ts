/** Core imports */
import { ChangeDetectionStrategy, Component, OnInit, Input, ViewChild } from '@angular/core';

/** Third party imports */
import { DxChartComponent } from 'devextreme-angular/ui/chart';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
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
    @Input() title = '';
    @Input() valueField: string;
    @Input() argumentField: string;
    @Input() width: string;
    @ViewChild(DxChartComponent) chartComponent: DxChartComponent;
    summaryBy: BehaviorSubject<SummaryBy> = new BehaviorSubject<SummaryBy>(SummaryBy.Month);
    summaryBy$: Observable<SummaryBy> = this.summaryBy.asObservable().pipe(distinctUntilChanged());
    summaryByList: string[] = values(SummaryBy).map((summaryBy: string) => capitalize(summaryBy));
    capitalize = capitalize;

    constructor(
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        window['t'] = this;
    }

    customizeBottomAxis(elem): string {
        const itemDate = new Date(elem.value);
        let label: string = itemDate.getFullYear().toString();
        if (this.summaryBy.value === SummaryBy.Quarter) {
            label += '/' + DateHelper.getQuarter(itemDate);
        } else if (this.summaryBy.value === SummaryBy.Month) {
            label += '/' + (+itemDate.getMonth() + 1);
        }
        return label;
    }
}
