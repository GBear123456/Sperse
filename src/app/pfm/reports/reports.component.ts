/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Subject, Observable } from 'rxjs';
import * as moment from 'moment-timezone';
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular';
import range from 'lodash/range';

/** Application imports */
import { AppComponentBase } from '@root/shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { CalendarDialogComponent } from '@app/shared/common/dialogs/calendar/calendar-dialog.component';
import { DateHelper } from '@root/shared/helpers/DateHelper';
import { AppConsts } from '@root/shared/AppConsts';
import { SetupStepsComponent } from '@app/shared/common/setup-steps/setup-steps.component';
import { DataGridService } from '@app/shared/common/data-grid.service.ts/data-grid.service';
import { CFOService } from '@shared/cfo/cfo.service';

@Component({
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.less'],
    providers: [ DatePipe ]
})
export class ReportsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild('offerStatsGrid') offerStatsGrid: DxDataGridComponent;
    @ViewChild('visitorsGrid') visitorsGrid: DxDataGridComponent;
    @ViewChild(SetupStepsComponent) setupStepsComponent: SetupStepsComponent;
    @ViewChild('rightSection') rightSection: ElementRef;

    headlineConfig;
    private rootComponent: any;
    private _refresh: Subject<null> = new Subject<null>();
    refresh$: Observable<null> = this._refresh.asObservable();
    section: 'clicks' | 'offers' | 'visitors' = 'clicks';
    dateFrom: moment;
    dateTo: moment;
    offerStatsDataSource: DataSource;
    offersStaticFilter = { 'RequestCount': { gt: 0 } };
    offersQuickSearch: string;
    visitorsDataSource: DataSource;
    visitorsCampaignId: number;
    visitorsQuickSearch: string;

    clickStatsYear: number = moment().year();
    years: number[] = range(2018, this.clickStatsYear + 1);

    menuItems = [
        {
            section: 'clicks',
            caption: this.l('ClickStats'),
            img: 'statistics',
            onClick: this.onMenuClick.bind(this)
        },
        {
            section: 'offers',
            caption: this.l('OfferStats'),
            img: 'document',
            onClick: this.onMenuClick.bind(this)
        },
        {
            section: 'visitors',
            caption: this.l('VisitorStats'),
            img: 'person',
            onClick: this.onMenuClick.bind(this)
        }
    ];

    constructor(
        injector: Injector,
        private appService: AppService,
        private dialog: MatDialog,
        private cfoService: CFOService,
        private datePipe: DatePipe
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.initConfigs();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);

        this.offerStatsDataSource = new DataSource({
            store: {
                type: 'odata',
                url: this.getODataUrl('Offer', this.offersStaticFilter),
                deserializeDates: false,
                version: AppConsts.ODataVersion,
                beforeSend: function (request) {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            },
            select: [
                'CampaignId',
                'LogoUrl',
                'Name',
                'Categories',
                'RequestCount'
            ],
            sort: [
                { selector: 'Created', desc: true }
            ]
        });

        this.visitorsDataSource = new DataSource({
            store: {
                key: 'Id',
                type: 'odata',
                url: this.getODataUrl('PfmOfferRequest'),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                }
            }
        });
    }

    initConfigs() {
        this.initHeadlineConfig();
        this.initToolbarConfig();
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('Reports')],
            buttons: [
                {
                    enabled: this.section != 'clicks',
                    class: 'button-layout button-default',
                    action: () => {
                        this.showCalendarDialog();
                    },
                    label: (this.dateFrom ? this.dateFrom.format('DD/MM/YYYY') : this.l('Start Date')) +
                        ' - ' + (this.dateTo ? this.dateTo.format('DD/MM/YYYY') : this.l('End Date'))
                }
            ]
        };
    }

    initToolbarConfig() {
        if (this.componentIsActivated) {
            this.appService.updateToolbar([
                {
                    location: 'before',
                    items: [
                        {
                            name: 'search',
                            widget: 'dxTextBox',
                            options: {
                                value: this.section == 'offers' ? this.offersQuickSearch : this.visitorsQuickSearch,
                                width: '279',
                                mode: 'search',
                                placeholder: this.l('Search') + ' '
                                    + this.l(this.section == 'offers' ? 'Offers' : 'Customers').toLowerCase(),
                                onValueChanged: (e) => {
                                    if (this.section == 'offers') {
                                        this.offersQuickSearch = e.value;
                                        this.refreshOfferStats();
                                    } else {
                                        this.visitorsQuickSearch = e.value;
                                        this.refreshVisitors();
                                    }
                                }
                            },
                            visible: this.section != 'clicks'
                        }
                    ]
                },
                {
                    location: 'after',
                    locateInMenu: 'auto',
                    items: [
                        {
                            name: 'showCompactRowsHeight',
                            visible: this.section !== 'clicks' && !this.cfoService.hasStaticInstance,
                            action: DataGridService.showCompactRowsHeight.bind(this, this.openedGrid)
                        },
                        {
                            name: 'download',
                            widget: 'dxDropDownMenu',
                            options: {
                                hint: this.l('Download'),
                                items: [
                                    {
                                        action: Function(),
                                        text: this.l('Save as PDF'),
                                        icon: 'pdf',
                                    },
                                    {
                                        action: this.exportToXLS.bind(this, 'all', this.openedGrid),
                                        text: this.l('Export to Excel'),
                                        icon: 'xls',
                                    },
                                    {
                                        action: this.exportToCSV.bind(this, 'all', this.openedGrid),
                                        text: this.l('Export to CSV'),
                                        icon: 'sheet'
                                    },
                                    {
                                        action: this.exportToGoogleSheet.bind(this, 'all', this.openedGrid),
                                        text: this.l('Export to Google Sheets'),
                                        icon: 'sheet'
                                    }
                                ],
                                visible: this.section !== 'clicks'
                            }
                        },
                        {
                            name: 'columnChooser',
                            visible: this.section !== 'clicks' && !this.cfoService.hasStaticInstance,
                            action: DataGridService.showColumnChooser.bind(this, this.openedGrid)
                        },
                        {
                            widget: 'dxButton',
                            options: {
                                text: 'Show all',
                                onClick: () => {
                                    this.visitorsCampaignId = null;
                                    this.refreshVisitors();
                                    this.initToolbarConfig();
                                }
                            },
                            visible: this.section == 'visitors' && this.visitorsCampaignId
                        }
                    ]
                },
            ]);
        }
    }

    onStatsClick(event) {
        this.onPeriodChanged(new Date(event.from), new Date(event.to));
        this.offersQuickSearch = null;
        this.setSection('offers', false);
        this.setupStepsComponent.setSelectedIndex(1);
        this.refreshOfferStats();
    }

    onMenuClick(item) {
        this.setSection(item.section);
    }

    get openedGrid() {
        let openedGrid = null;
        if (this.section === 'offers') {
            openedGrid = this.offerStatsGrid;
        } else if (this.section === 'visitors') {
            openedGrid = this.visitorsGrid;
        }
        return openedGrid;
    }

    setSection(section, repaint = true) {
        if (this.section == section)
            return;

        this.loadingService.startLoading(this.rightSection.nativeElement);
        this.section = section;
        this.initConfigs();
        if (repaint) {
            setTimeout(() => {
                if (section == 'offers')
                    this.offerStatsGrid.instance.repaint();
                else if (section == 'visitors')
                    this.visitorsGrid.instance.repaint();
                this.loadingService.finishLoading(this.rightSection.nativeElement);
            });
        } else {
            this.loadingService.finishLoading(this.rightSection.nativeElement);
        }
    }

    onOfferClicksClick(field) {
        this.visitorsCampaignId = field.data.CampaignId;
        this.visitorsQuickSearch = null;
        this.setSection('visitors', false);
        this.setupStepsComponent.setSelectedIndex(2);
        this.refreshVisitors();
    }

    refreshOfferStats() {
        let customFilter = [];
        if (this.dateFrom)
            customFilter.push({ name: 'RequestDateFrom', value: this.dateFrom.toDate().toJSON() });
        if (this.dateTo)
            customFilter.push({ name: 'RequestDateTo', value: this.dateTo.toDate().toJSON() });
        let filters: any[] = [this.offersStaticFilter];
        if (this.offersQuickSearch)
            filters.push({ 'Name': { contains: this.offersQuickSearch } });
        this.processODataFilter(this.offerStatsGrid.instance, 'Offer', filters, (filter) => filter, null, customFilter);
    }

    onPeriodChanged(from: Date, to: Date): boolean {
        let dateTo = to && DateHelper.removeTimezoneOffset(to, true, 'to');
        let dateFrom = from && DateHelper.removeTimezoneOffset(from, true, 'from');
        if ((this.dateTo ? this.dateTo.diff(dateTo, 'days') : dateTo) ||
            (this.dateFrom ? this.dateFrom.diff(dateFrom, 'days') : dateFrom)
        ) {
            dateTo = dateTo && moment(dateTo);
            dateFrom = dateFrom && moment(dateFrom);
            if (dateTo != this.dateTo || dateFrom != this.dateFrom) {
                this.dateTo = dateTo && moment(dateTo);
                this.dateFrom = dateFrom && moment(dateFrom);
                this.initHeadlineConfig();
                return true;
            }
        }

        return false;
    }

    onVisitorCellClick(event) {
        this._router.navigate(['app/pfm/user', event.data.ApplicantUserId],
            { queryParams: { referrer: location.pathname } });
    }

    refreshVisitors() {
        let visitorsFilter = [];
        if (this.dateFrom)
            visitorsFilter.push({ Date: { gt: this.dateFrom.toDate() } });
        if (this.dateTo)
            visitorsFilter.push({ Date: { lt: this.dateTo.toDate() } });
        if (this.visitorsCampaignId)
            visitorsFilter.push({ CampaignId: this.visitorsCampaignId });
        if (this.visitorsQuickSearch)
            visitorsFilter.push(this.getSearchFilter(['FirstName', 'LastName', 'Email', 'PhoneNumber'], this.visitorsQuickSearch));

        this.processODataFilter(this.visitorsGrid.instance, 'PfmOfferRequest', visitorsFilter, (filter) => filter);
    }

    getCategoryValue(data) {
        return data.Categories.map(item => item.Name).join(', ');
    }

    yearSelectionChanged() {
        this.initHeadlineConfig();
    }

    showCalendarDialog() {
        this.dialog.closeAll();
        this.dialog.open(CalendarDialogComponent, {
            panelClass: ['slider'],
            disableClose: false,
            hasBackdrop: false,
            closeOnNavigation: true,
            data: {
                to: { value: this.dateTo && DateHelper.addTimezoneOffset(this.dateTo.toDate(), true) },
                from: { value: this.dateFrom && DateHelper.addTimezoneOffset(this.dateFrom.toDate(), true) },
                options: {}
            }
        }).afterClosed().subscribe((data) => {
            if (!data) return;
            if (this.onPeriodChanged(data.dateFrom, data.dateTo)) {
                this.refreshOfferStats();
                this.refreshVisitors();
            }
        });
    }

    ngOnDestroy() {
        this.deactivate();
        super.ngOnDestroy();
    }

    activate() {
        super.activate();
        this.rootComponent.overflowHidden(true);
        this.initConfigs();
    }

    deactivate() {
        super.deactivate();
        this.rootComponent.overflowHidden();
        this.appService.updateToolbar(null);
    }

    getVisitorFullName = (e) => {
        return e.FirstName + ' ' + e.LastName;
    }

    getCreatedDate = (e) => {
        return this.datePipe.transform(e.Date, AppConsts.formatting.dateTime, this.userTimezone);
    }
}
