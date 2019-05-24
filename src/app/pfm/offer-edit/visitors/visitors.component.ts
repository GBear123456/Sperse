/** Core imports */
import {
    AfterViewInit,
    Component,
    Injector,
    OnInit,
    Input,
    OnDestroy,
    ViewChild,
    QueryList
} from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import 'devextreme/data/odata/store';
import { Observable, from, of } from 'rxjs';
import { finalize, flatMap, tap, pluck, map } from 'rxjs/operators';
import * as moment from 'moment-timezone';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactServiceProxy } from '@shared/service-proxies/service-proxies';
import { CalendarDialogComponent } from '@app/shared/common/dialogs/calendar/calendar-dialog.component';


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

    constructor(injector: Injector,
        private _clientService: ContactServiceProxy,
        private _dialog: MatDialog        
    ) {
        super(injector);
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
            result.push({Date: {gt: this.dateFrom.toJSON()}});
        if (this.dateTo)
            result.push({Date: {lt: this.dateTo.toJSON()}});
        return result;
    }

    onDataGridInit(e) {
        this.startLoading();
    }

    startLoading() {
        super.startLoading(false);
    }

    finishLoading() {
        super.finishLoading(false);
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
                        text: 'Date Here',
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
                    { name: 'showCompactRowsHeight', action: this.showCompactRowsHeight.bind(this) },
                    { name: 'columnChooser', action: this.showColumnChooser.bind(this) }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'fullscreen',
                        action: () => {
                            this.toggleFullscreen(document.documentElement);
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
        this.processODataFilter(this.dataGrid.instance, 
            this.dataSourceURI, this.getInputFilter(), filter => filter);
        this.startLoading();
    }

    showColumnChooser() {
        this.dataGrid.instance.showColumnChooser();
    }

    showCompactRowsHeight() {
        this.dataGrid.instance.element().classList.toggle('grid-compact-view');
        this.dataGrid.instance.updateDimensions();
    }

    showCalendarDialog() {
        this._dialog.open(CalendarDialogComponent, {
            panelClass: 'slider',
            disableClose: false,
            hasBackdrop: false,
            closeOnNavigation: true,
            data: {
                to: {},
                from: {},
                options: {}
            }
        }).afterClosed().subscribe(() => {

        });
    }

    onContentReady(event) {
        this.setGridDataLoaded();
        this.finishLoading();
    }

    ngOnDestroy() {

    }

    onCellClick(event) {
        this._router.navigate(['app/pfm/contact', event.data.ContactId],
            { queryParams: { referrer: location.pathname } });
    }
}