/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Subject, Observable } from 'rxjs';
import * as moment from 'moment-timezone';
import DataSource from 'devextreme/data/data_source';
import { DxDataGridComponent } from 'devextreme-angular';

/** Application imports */
import { AppComponentBase } from '@root/shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { CalendarDialogComponent } from '@app/shared/common/dialogs/calendar/calendar-dialog.component';
import { DateHelper } from '@root/shared/helpers/DateHelper';
import { AppConsts } from '@root/shared/AppConsts';
import { SetupStepsComponent } from '@app/shared/common/setup-steps/setup-steps.component';
import range from 'lodash/range';

@Component({
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.less'],
    providers: []
})
export class ReportsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild('offerStatsGrid') offerStatsGrid: DxDataGridComponent;
    @ViewChild('visitorsGrid') visitorsGrid: DxDataGridComponent;
    @ViewChild(SetupStepsComponent) setupStepsComponent: SetupStepsComponent;

    private _refresh: Subject<null> = new Subject<null>();
    refresh$: Observable<null> = this._refresh.asObservable();
    section: 'clicks' | 'offers' | 'visitors' = 'clicks';
    dateFrom: moment;
    dateTo: moment;
    formatting = AppConsts.formatting;
    offerStatsDataSource: DataSource;
    offersStaticFilter = {'RequestCount': { gt: 0 }};
    visitorsDataSource: DataSource;
    visitorsCampaignId: number;

    clickStatsYearIndex: number = 1;
    clickStatsYear: number = moment().year();
    years: number[] = range(2018, this.clickStatsYear + 1);

    headlineConfig = {
        names: [this.l('Reports')],
        buttons: []
    };

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
        private _appService: AppService,
        private _dialog: MatDialog
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.initToolbarConfig();

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

    initToolbarConfig() {
        if (this.componentIsActivated) {
            this._appService.updateToolbar([
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
                        },
                        visible: this.section != 'clicks'
                    },{
                        text: '',
                        name: 'select-box',
                        widget: 'dxDropDownMenu',
                        options: {
                            width: 80,
                            selectedIndex: this.clickStatsYearIndex,
                            items: [
                                {
                                    text: '2018',
                                    value: 2018
                                }, {
                                    text: '2019',
                                    value: 2019
                                }, {
                                    text: '2020',
                                    value: 2020
                                }
                            ],
                            onSelectionChanged: (e) => {
                                if (e) {
                                    this.clickStatsYearIndex = e.itemIndex;
                                    this.clickStatsYear = e.itemData.value;
                                    this.initToolbarConfig();
                                }
                            }
                        },
                        visible: this.section == 'clicks'
                    }]
                },
                {
                    location: 'after',
                    items: [
                        {
                            widget: 'dxButton',
                            options: {
                                text: 'Show all',
                                onClick: (event) => {
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
        this.setSection('offers', false);
        this.setupStepsComponent.setSelectedIndex(1);
        this.refreshOfferStats();
    }

    onMenuClick(item) {
        this.setSection(item.section);
    }

    setSection(section, repaint = true) {
        if (this.section == section)
            return;

        this.section = section;
        this.initToolbarConfig()
        if (repaint)
        {
            setTimeout(() => {
                if (section == 'offers')
                    this.offerStatsGrid.instance.repaint();
                else if (section == 'visitors')
                    this.visitorsGrid.instance.repaint();
            });
        }
    }

    onOfferClicksClick(field) {
        this.visitorsCampaignId = field.data.CampaignId;
        this.setSection('visitors', false);
        this.setupStepsComponent.setSelectedIndex(2);
        this.refreshVisitors();
        this.initToolbarConfig();
    }

    refreshOfferStats(){
        var customFilter = [];
        if (this.dateFrom)
            customFilter.push({name: 'CountDateFrom', value: this.dateFrom.toDate().toJSON()});
        if (this.dateTo)
            customFilter.push({name: 'CountDateTo', value: this.dateTo.toDate().toJSON()});
        this.processODataFilter(this.offerStatsGrid.instance, 'Offer', [this.offersStaticFilter], (filter) => filter, null, customFilter);
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
                this.initToolbarConfig();
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
            visitorsFilter.push({Date: {gt: this.dateFrom.toDate()}});
        if (this.dateTo)
            visitorsFilter.push({Date: {lt: this.dateTo.toDate()}});

        if (this.visitorsCampaignId)
        {
            visitorsFilter.push({CampaignId: this.visitorsCampaignId});
        }

        this.processODataFilter(this.visitorsGrid.instance, 'PfmOfferRequest', visitorsFilter, (filter) => filter);
    }

    getCategoryValue(data) {
        return data.Categories.map(item => item.Name).join(', ');
    }

    showCalendarDialog() {
        this._dialog.closeAll();
        this._dialog.open(CalendarDialogComponent, {
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
            if (this.onPeriodChanged(data.dateFrom, data.dateTo))
            {
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
        this.initToolbarConfig();
    }

    deactivate() {
        super.deactivate();
        this._appService.updateToolbar(null);
    }
}
