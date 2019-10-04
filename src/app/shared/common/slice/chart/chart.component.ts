/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    ViewChild,
    OnChanges,
    OnInit,
    SimpleChanges
} from '@angular/core';

/** Third party imports */
import { DxChartComponent } from 'devextreme-angular/ui/chart';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import values from 'lodash/values';
import capitalize from 'lodash/capitalize';
import { getMarkup } from 'devextreme/viz/export';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { SummaryBy } from '@app/shared/common/slice/chart/summary-by.enum';
import { DateHelper } from '@shared/helpers/DateHelper';
import { InfoItem } from '@app/shared/common/slice/info/info-item.model';
import { ExportService } from '@shared/common/export/export.service';
import { ChartData } from '@app/shared/common/slice/chart/chart-data.model';
import { ImageFormat } from '@shared/common/export/image-format.enum';

@Component({
    selector: 'slice-chart',
    templateUrl: 'chart.component.html',
    styleUrls: [ './chart.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartComponent implements OnInit, OnChanges {
    @Input() title = '';
    @Input() valueField: string;
    @Input() argumentField: string;
    @Input() width: number;
    @Input() height: number;
    @Input() infoItems: InfoItem[];
    @ViewChild(DxChartComponent) chart: DxChartComponent;
    chartHeight: number;
    chartWidth: number;
    summaryBy: BehaviorSubject<SummaryBy> = new BehaviorSubject<SummaryBy>(SummaryBy.Month);
    summaryBy$: Observable<SummaryBy> = this.summaryBy.asObservable().pipe(distinctUntilChanged());
    summaryByList: string[] = values(SummaryBy).map((summaryBy: string) => capitalize(summaryBy));
    capitalize = capitalize;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private exportService: ExportService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        /** To avoid updating of UI after every devextreme event */
        this.changeDetectorRef.detach();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.height) {
            this.chartHeight = changes.height.currentValue - 183;
        }
        if (changes.width) {
            this.chartWidth = changes.width.currentValue - 40;
        }
        if (changes.height || changes.width || changes.infoItems) {
            this.changeDetectorRef.detectChanges();
        }
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

    summaryByChanged(e) {
        this.summaryBy.next(e.value.toLowerCase());
    }

    private getChartData(): ChartData[] {
        return this.chart.instance.getDataSource().items().map((item) => {
            return {
                name: this.customizeBottomAxis(item[this.argumentField]),
                value: item[this.valueField]
            };
        });
    }

    exportTo(format: ImageFormat) {
        const markup = this.getChartMarkup();
        this.exportService.exportIntoImage(format, markup, this.width, this.height);
    }

    /**
     * Get the markup using devextreme getMarkup method and replacing linear gradient url with the simple color
     * @return {string}
     */
    getChartMarkup() {
        return getMarkup([this.chart.instance])
            .replace(new RegExp('url\\(#linear-gradient\\)', 'g'), '#00aeef');
    }

}
