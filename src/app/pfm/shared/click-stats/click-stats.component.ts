/** Core imports */
import { ChangeDetectionStrategy, OnInit,
    Component, Input, Injector, ViewChild } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as moment from 'moment-timezone';
import zipObject from 'lodash/zipObject';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { OfferServiceProxy, GroupByPeriod } from 'shared/service-proxies/service-proxies';

@Component({
    selector: 'pfm-click-stats',
    templateUrl: './click-stats.component.html',
    styleUrls: ['./click-stats.component.less'],
    animations: [appModuleAnimation()],
    providers: [OfferServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClickStatsComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    @Input() refresh$: Observable<null>;
    @Input() campaignId;
    @Input()
    set year(val: number) {
        this._year = val;
        this.invalidate();
    }
    private _year = moment().year();

    data: any;
    months = moment.monthsShort();
    readonly MAX_ROW_COUNT = 32;
    readonly TOTAL_COL_INDEX = 0;
    readonly TOTAL_DATA_FIELD = 'day';
    columns = this.months.map((col) => {
        return {
            dataField: col,
            alignment: 'left',
            cellTemplate: 'countCell'
        };
    });

    constructor(
        injector: Injector,
        private _offerService: OfferServiceProxy
    ) {
        super(injector);

        this.initTotalColumn();
        this.dataSource = new DataSource({
            key: 'value',
            load: () => {
                return this._offerService.getOffersStats(
                    GroupByPeriod.Daily,
                    this.campaignId,
                    moment().year(this._year).startOf('year'),
                    moment().year(this._year).endOf('year')
                ).toPromise().then(response => {
                    return {
                        data: this.getDataByDay(response),
                        totalCount: this.MAX_ROW_COUNT
                    };
                });
            }
        });
    }

    ngOnInit() {
        this.refresh$.pipe(takeUntil(this.destroy$))
            .subscribe(() => this.invalidate());
    }

    initTotalColumn() {
        this.columns.unshift({
            dataField: this.TOTAL_DATA_FIELD,
            caption: 'Monthly Totals Clicks by Day',
            alignment: 'center',
            width: 120
        });
    }

    getDataByDay(res) {
        let data = new Array(this.MAX_ROW_COUNT);
        data[this.TOTAL_COL_INDEX] = zipObject(
            this.columns.map((col) => col.dataField),
            this.columns.map(() => 0));

        res.forEach((item) => {
            let dayIndex = item.date.date(),
                month = item.date.format('MMM');

            if (!data[dayIndex]) data[dayIndex] = {};
            data[dayIndex][this.TOTAL_DATA_FIELD] = dayIndex;
            data[dayIndex][month] = item.count;

            data[this.TOTAL_COL_INDEX][month] += item.count;
            data[this.TOTAL_COL_INDEX][this.TOTAL_DATA_FIELD] += item.count;
        });

        return this.data = data;
    }

    freezeFirstRow(elm) {
        let header = elm.querySelector('.dx-datagrid-headers table');
        if (header.lastChild.classList.contains('dx-row'))
            header.removeChild(header.lastChild);
        header.appendChild(
            elm.querySelector('.dx-datagrid-rowsview tr:first-child')
        );
    }

    getColumnPercentage(record) {
        let field = record.column.dataField,
            cellValue = record.data[field],
            totalValue = this.data[this.TOTAL_COL_INDEX][
                record.rowIndex ? field : this.TOTAL_DATA_FIELD];
        return cellValue ? (cellValue / totalValue * 100).toFixed(1) + '%' :
            (record.rowIndex ? '' : '0.0%');
    }

    onContentReady(event) {
        this.freezeFirstRow(event.element);
    }

    showVisitors(record) {
        let date = record.data.day + record.column.dataField + this._year;
        this._router.navigate(['../visitors'],
            { relativeTo: this._activatedRoute, queryParams: { from: date, to: date} });
    }
}