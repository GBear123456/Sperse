/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import moment from 'moment-timezone';

/** Application imports */
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { FileSizePipe } from '@shared/common/pipes/file-size.pipe';
import { ReportsServiceProxy, GenerateInput, GenerateInputPeriod } from '@shared/service-proxies/service-proxies';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CalendarDialogComponent } from '@app/shared/common/dialogs/calendar/calendar-dialog.component';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.less'],
    providers: [ ReportsServiceProxy, FileSizePipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    dateFrom = moment().subtract(1, 'month').startOf('month');
    dateTo = moment().subtract(1, 'month').endOf('month');

    headlineConfig;
    menuItems = [
        {
            caption: 'MonthlyReports',
            period: GenerateInputPeriod.Monthly
        },
        {
            caption: 'QuarterlyReports',
            period: GenerateInputPeriod.Quarterly
        },
        {
            caption: 'AnnualReports',
            period: GenerateInputPeriod.Annual
        }
    ];

    selectedPeriod = GenerateInputPeriod.Monthly;
    formatting = AppConsts.formatting;
    dataSourceURI = 'Reporting';

    constructor(
        private injector: Injector,
        private _dialog: MatDialog,
        private _appService: AppService,
        private _fileSizePipe: FileSizePipe,
        private _changeDetector: ChangeDetectorRef,
        public reportsProxy: ReportsServiceProxy,
        public bankAccountsService: BankAccountsService
    ) {
        super(injector);
        this.dataSource = {
              store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI, this.getFilters()),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                    if (request.params.$filter && request.url.indexOf('$filter')) {
                        let parts = request.url.split('?');
                        request.url = parts.shift() + '?' + parts.pop().split('&').reduce((acc, item) => {
                            let arrgs = item.split('=');
                            if (arrgs[0] == '$filter') {
                                request.params.$filter = '(' + request.params.$filter + ') and (' + arrgs[1] + ')';
                                return acc;
                            } else
                                return acc + (acc ? '&' : '') + arrgs.join('=');
                        }, '');
                    }
                }
            }
        };
    }

    ngOnInit(): void {
        this.initHeadlineConfig();
    }

    ngAfterViewInit(): void {
        this.activate();
    }

    onToolbarPreparing($event) {
        $event.toolbarOptions.items.push({
            location: 'before',
            widget: 'dxButton',
            options: {
                text: this.l('Generate'),
                visible: this.isInstanceAdmin || this.isMemberAccessManage,
                onClick: () => {
                    this.notify.info(this.l('GeneratingStarted'));
                    this.reportsProxy.generate(<any>this.instanceType, this.instanceId, new GenerateInput({
                        from: this.dateFrom,
                        to: this.dateTo,
                        period: this.selectedPeriod,
                        bankAccountIds: []
                    })).subscribe(() => {
                        this.notify.info(this.l('SuccesfullyGenerated'));
                        this.invalidate();
                    });
                }
            }
        }, {
            location: 'center',
            widget: 'dxButton',
            options: {
                text: this.getDateButtonText(),
                onClick: (event) => {
                    this.showCalendarDialog(() => {
                        event.component.option('text', this.getDateButtonText());
                    });
                }
            }
        });
    }

    getDateButtonText() {
        return (this.dateFrom ? this.dateFrom.format('DD/MM/YYYY') : this.l('Start Date')) +
            ' - ' + (this.dateTo ? this.dateTo.format('DD/MM/YYYY') : this.l('End Date'));
    }

    showCalendarDialog(callback) {
        this._dialog.closeAll();
        this._dialog.open(CalendarDialogComponent, {
            panelClass: [ 'slider' ],
            disableClose: false,
            hasBackdrop: false,
            closeOnNavigation: true,
            data: {
                to: { value: this.dateTo && DateHelper.addTimezoneOffset(this.dateTo.toDate(), true) },
                from: { value: this.dateFrom && DateHelper.addTimezoneOffset(this.dateFrom.toDate(), true) },
                options: { }
            }
        }).afterClosed().subscribe((data) => {
            if ((this.dateTo ? this.dateTo.diff(data.dateTo, 'days') : data.dateTo) ||
                (this.dateFrom ? this.dateFrom.diff(data.dateFrom, 'days') : data.dateFrom)
            ) {
                this.dateFrom = data.dateFrom && moment(data.dateFrom);
                this.dateTo = data.dateTo && moment(data.dateTo);
                this.processFilterInternal();
                callback();
            }
        });
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('REPORTS')],
            onRefresh: () => {
                this.dataGrid.instance.refresh();
            },
            iconSrc: './assets/common/icons/credit-card-icon.svg'
        };
    }

    calculateFileSizeValue = (data) => this._fileSizePipe.transform(data.Size);
    numerizeFileSizeSortValue = (data) => +data.Size;

    onDataGridInit(event) {
        this._changeDetector.markForCheck();
    }

    onCellClick(event) {
        if (event.data && event.data.Id)
            this.reportsProxy.getUrl(<any>this.instanceType, this.instanceId, event.data.Id)
                .subscribe(res => window.open(res.url));
    }

    onContentReady() {
        this.setGridDataLoaded();
    }

    getFilters() {
        return [
            {Period: this.selectedPeriod},
            {From: {ge: this.dateFrom.toDate()}},
            {To: {le: this.dateTo.toDate()}}
        ];
    }

    processFilterInternal() {
        this.processODataFilter(
            this.dataGrid.instance,
            this.dataSourceURI,
            this.getFilters(),
            (filter) => filter
        );
    }

    onMenuClick(item) {
        let period = {
            Monthly: 'month',
            Quarterly: 'quarter',
            Annual: 'year'
        }[item.period];

        this.selectedPeriod = item.period;
        this.dateFrom = moment().subtract(1, period).startOf(period);
        this.dateTo = moment().subtract(1, period).endOf(period);

        this.processFilterInternal();
        this.dataGrid.instance.repaint();
    }

    ngOnDestroy() {
        this.deactivate();
    }

    activate() {
        this.getRootComponent().overflowHidden(true);
    }

    deactivate() {
        this.getRootComponent().overflowHidden();
    }
}
