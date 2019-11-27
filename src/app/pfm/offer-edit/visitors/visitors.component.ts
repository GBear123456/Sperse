/** Core imports */
import {
    AfterViewInit,
    Component,
    Injector,
    OnInit,
    Input,
    ViewChild,
    OnDestroy
} from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import * as moment from 'moment-timezone';
import capitalize from 'lodash/capitalize';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CalendarDialogComponent } from '@app/shared/common/dialogs/calendar/calendar-dialog.component';
import { DateHelper } from '@shared/helpers/DateHelper';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';

@Component({
    selector: 'pfm-offer-visitors',
    templateUrl: './visitors.component.html',
    styleUrls: ['./visitors.component.less']
})
export class VisitorsComponent extends AppComponentBase implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;

    @Input() dateFrom: moment;
    @Input() dateTo: moment;
    @Input() campaignId: number;

    toolbarConfig: any;
    dataSourceURI = 'PfmOfferRequest';
    formatting = AppConsts.formatting;
    queryParamsSubscription: any;

    constructor(injector: Injector,
        private _dialog: MatDialog
    ) {
        super(injector);
        this.queryParamsSubscription = this._activatedRoute.queryParams.subscribe(params => {
            ['from', 'to'].map((field) => {
                if (params[field])
                    this['date' + capitalize(field)] = moment(
                        DateHelper.removeTimezoneOffset(new Date(params[field]), true, field)
                    );
            });
        });

        this.searchColumns = ['FirstName', 'LastName', 'Email', 'PhoneNumber'];
        this.searchValue = '';
    }

    refreshDataGrid() {
        this.dataGrid.instance.refresh();
    }

    ngOnInit() {
        this.dataSource = {
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl(this.dataSourceURI, this.getInputFilter()),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                }
            }
        };
    }

    ngAfterViewInit() {
        this.initToolbarConfig();
    }

    getInputFilter() {
        let result: any = [{CampaignId: this.campaignId}];
        if (this.dateFrom)
            result.push({Date: {gt: this.dateFrom.toDate()}});
        if (this.dateTo)
            result.push({Date: {lt: this.dateTo.toDate()}});

        return result;
    }

    onDataGridInit(e) {
        this.startLoading();
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'before',
                items: [
                    {
                        name: 'search',
                        widget: 'dxTextBox',
                        options: {
                            value: this.searchValue,
                            width: '279',
                            mode: 'search',
                            placeholder: this.l('Search') + ' ' + this.l('Customers').toLowerCase(),
                            onValueChanged: (e) => {
                                this.searchValueChange(e);
                            }
                        }
                    }
                ]
            },
            {
                location: 'center',
                items: [{
                    widget: 'dxButton',
                    options: {
                        text: (this.dateFrom ? this.dateFrom.format('DD/MM/YYYY') : this.l('Start Date')) +
                            ' - ' + (this.dateTo ? this.dateTo.format('DD/MM/YYYY') : this.l('End Date')),
                        onClick: (event) => {
                            this.showCalendarDialog();
                        }
                    }
                }]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'download',
                        widget: 'dxDropDownMenu',
                        options: {
                            hint: this.l('Download'),
                            items: [{
                                action: Function(),
                                text: this.l('Save as PDF'),
                                icon: 'pdf',
                            }, {
                                action: this.exportToXLS.bind(this),
                                text: this.l('Export to Excel'),
                                icon: 'xls',
                            }, {
                                action: this.exportToCSV.bind(this),
                                text: this.l('Export to CSV'),
                                icon: 'sheet'
                            }, {
                                action: this.exportToGoogleSheet.bind(this),
                                text: this.l('Export to Google Sheets'),
                                icon: 'sheet'
                            }, { type: 'downloadOptions' }]
                        }
                    },
                    { name: 'print', action: Function() }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    { name: 'showCompactRowsHeight', action: DataGridService.showCompactRowsHeight.bind(this, this.dataGrid, true) },
                    { name: 'columnChooser', action: DataGridService.showColumnChooser.bind(this, this.dataGrid) }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'fullscreen',
                        action: () => {
                            this.fullScreenService.toggleFullscreen(document.documentElement);
                            setTimeout(() => this.dataGrid.instance.repaint(), 100);
                        }
                    }
                ]
            }
        ];
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.initToolbarConfig();
        this.processDataInternal();
        this.startLoading();
    }

    processDataInternal() {
        this.startLoading();
        this.processODataFilter(this.dataGrid.instance,
            this.dataSourceURI, this.getInputFilter(), filter => filter);
    }

    showCalendarDialog() {
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
            if (!data) return;
            const dateFrom = data.dateFrom && DateHelper.removeTimezoneOffset(data.dateFrom, true, 'from');
            const dateTo = data.dateTo && DateHelper.removeTimezoneOffset(data.dateTo, true, 'to');

            this.dateFrom = dateFrom && moment(dateFrom);
            this.dateTo = dateTo && moment(dateTo);
            this.processDataInternal();
            this.initToolbarConfig();

        });
    }

    onContentReady() {
        this.setGridDataLoaded();
        this.finishLoading();
    }

    onCellClick(event) {
        this._router.navigate(['app/pfm/user', event.data.ApplicantUserId],
            { queryParams: { referrer: location.pathname } });
    }

    ngOnDestroy() {
        this.queryParamsSubscription.unsubscribe();
        this._dialog.closeAll();
    }
}
