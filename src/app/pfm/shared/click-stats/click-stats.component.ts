/** Core imports */
import { ChangeDetectionStrategy, OnInit,
    Component, Input, Injector, ViewChild, Output, EventEmitter } from '@angular/core';

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

    @Output() onStatsClick: EventEmitter<any> = new EventEmitter<any>();
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
                    moment.utc().year(this._year).startOf('year'),
                    moment.utc().year(this._year).endOf('year')
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
            caption: 'Monthly Totals',
            alignment: 'center',
            width: 120,
            cellTemplate: 'totalCell'
        });
    }

    getDataByDay(res) {
        let data = new Array(this.MAX_ROW_COUNT).fill(0).map((row, index) => {
            return index == this.TOTAL_COL_INDEX ?
                zipObject(
                    this.columns.map((col) => col.dataField),
                    this.columns.map(() => 0)) : {[this.TOTAL_DATA_FIELD]: index};
        });

        res.forEach((item) => {
            let month = item.date.utc().format('MMM');
            data[item.date.utc().date()][month] = item.count;
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

    getQueryStringDate(day, month) {
        return day + month + this._year;
    }

    getMonthLastDay(monthIndex) {
        return new Date(this._year, monthIndex, 0).getDate();
    }

    showVisitors(record) {
        let day = record.data.day, 
            month = record.column.dataField,
            isOneDay = Boolean(record.rowIndex),
            dateFrom = this.getQueryStringDate(isOneDay ? day : 1, month),
            dateTo = this.getQueryStringDate(isOneDay ? day : 
                this.getMonthLastDay(record.column.index), month);
        
        this.onStatsClick.emit({ from: dateFrom, to: dateTo });
    }

    showVisitorsTotal(record) {
        if (record.rowIndex)
            return;

        let dateFrom = this.getQueryStringDate(1, 'Jan'),
            dateTo = this.getQueryStringDate(31, 'Dec');

        this.onStatsClick.emit({ from: dateFrom, to: dateTo });
    }
}
