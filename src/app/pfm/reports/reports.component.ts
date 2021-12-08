/** Core imports */
import { Component, Injector, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Subject, Observable } from 'rxjs';
import * as moment from 'moment-timezone';
import range from 'lodash/range';

/** Application imports */
import { AppComponentBase } from '@root/shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { CalendarDialogComponent } from '@app/shared/common/dialogs/calendar/calendar-dialog.component';
import { DateHelper } from '@root/shared/helpers/DateHelper';
import { LeftMenuComponent } from '@app/shared/common/left-menu/left-menu.component';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { CFOService } from '@shared/cfo/cfo.service';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { OfferStatsComponent } from './offer-stats/offer-stats.component';
import { VisitorsStatsComponent } from './visitors-stats/visitors-stats.component';
import { LeftMenuItem } from '@app/shared/common/left-menu/left-menu-item.interface';
import { OfferStatsDto } from '@app/pfm/reports/offer-stats/offer-stats-dto.type';

@Component({
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.less']
})
export class ReportsComponent extends AppComponentBase implements OnInit, OnDestroy {
    @ViewChild(LeftMenuComponent) leftMenuComponent: LeftMenuComponent;
    @ViewChild('rightSection') rightSection: ElementRef;
    @ViewChild(OfferStatsComponent, { static: true }) offerStatsComponent: OfferStatsComponent;
    @ViewChild(VisitorsStatsComponent, { static: true }) visitorsStatsComponent: VisitorsStatsComponent;

    private rootComponent: any;
    private _refresh: Subject<null> = new Subject<null>();
    refresh$: Observable<null> = this._refresh.asObservable();
    section: 'clicks' | 'offers' | 'visitors' = 'clicks';
    dateFrom: moment;
    dateTo: moment;

    clickStatsYear: number = moment().year();
    years: number[] = range(2018, this.clickStatsYear + 1);
    leftMenuItems: LeftMenuItem[] = [
        {
            name: 'clicks',
            caption: this.l('ClickStats'),
            iconSrc: './assets/common/icons/statistics.svg',
            onClick: this.onMenuClick.bind(this)
        },
        {
            name: 'offers',
            caption: this.l('OfferStats'),
            iconSrc: './assets/common/icons/document.svg',
            onClick: this.onMenuClick.bind(this)
        },
        {
            name: 'visitors',
            caption: this.l('VisitorStats'),
            iconSrc: './assets/common/icons/person.svg',
            onClick: this.onMenuClick.bind(this)
        }
    ];
    headlineButtons: HeadlineButton[];
    toolbarConfig: ToolbarGroupModel[];

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        public cfoService: CFOService,
        public appService: AppService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.initConfigs();
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    initConfigs() {
        this.initHeadlineButtons();
        this.initToolbarConfig();
    }

    initHeadlineButtons() {
        this.headlineButtons = [
            {
                enabled: this.section != 'clicks',
                class: 'button-layout button-default',
                action: () => {
                    this.showCalendarDialog();
                },
                label: (this.dateFrom ? this.dateFrom.format('DD/MM/YYYY') : this.l('Start Date')) +
                ' - ' + (this.dateTo ? this.dateTo.format('DD/MM/YYYY') : this.l('End Date'))
            }
        ];
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
                            value: this.section == 'offers' ? this.offerStatsComponent.quickSearch : this.visitorsStatsComponent.quickSearch,
                            width: '279',
                            mode: 'search',
                            placeholder: this.l('Search') + ' '
                                + this.l(this.section == 'offers' ? 'Offers' : 'Customers').toLowerCase(),
                            onValueChanged: (e) => {
                                if (this.section == 'offers') {
                                    this.offerStatsComponent.quickSearch = e.value;
                                    this.refreshOfferStats();
                                } else {
                                    this.visitorsStatsComponent.quickSearch = e.value;
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
                        action: DataGridService.toggleCompactRowsHeight.bind(this, this.openedGrid)
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
                        widget: 'dxButton',
                        options: {
                            text: 'Show all',
                            onClick: () => {
                                this.visitorsStatsComponent.campaignId = null;
                                this.refreshVisitors();
                                this.initToolbarConfig();
                            }
                        },
                        visible: this.section == 'visitors' && !!this.visitorsStatsComponent.campaignId
                    }
                ]
            },
        ];
    }

    toggleColumnChooser() {
        DataGridService.showColumnChooser(this.openedGrid);
    }

    onStatsClick(event) {
        this.onPeriodChanged(new Date(event.from), new Date(event.to));
        this.offerStatsComponent.quickSearch = null;
        this.setSection('offers', false);
        this.leftMenuComponent.setSelectedIndex(1);
        this.refreshOfferStats();
    }

    onMenuClick(item: LeftMenuItem) {
        this.setSection(item.name);
    }

    get openedGrid() {
        let openedGrid = null;
        if (this.section === 'offers') {
            openedGrid = this.offerStatsComponent.dataGrid;
        } else if (this.section === 'visitors') {
            openedGrid = this.visitorsStatsComponent.dataGrid;
        }
        return openedGrid;
    }

    setSection(section, repaint = true) {
        if (this.section == section)
            return;

        this.section = section;
        this.initConfigs();
        if (repaint) {
            setTimeout(() => {
                if (section == 'offers')
                    this.offerStatsComponent.repaint();
                else if (section == 'visitors')
                    this.visitorsStatsComponent.repaint();
            });
        }
    }

    offerClicksClick(offer: OfferStatsDto) {
        this.visitorsStatsComponent.campaignId = offer.CampaignId;
        this.visitorsStatsComponent.quickSearch = null;
        this.setSection('visitors', false);
        this.leftMenuComponent.setSelectedIndex(2);
        this.refreshVisitors();
    }

    refreshOfferStats() {
        this.offerStatsComponent.refresh(this.dateFrom, this.dateTo);
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
                this.initHeadlineButtons();
                return true;
            }
        }

        return false;
    }

    refreshVisitors() {
        let visitorsFilter = [];
        if (this.dateFrom)
            visitorsFilter.push({ Date: { gt: this.dateFrom.toDate() } });
        if (this.dateTo)
            visitorsFilter.push({ Date: { lt: this.dateTo.toDate() } });
        if (this.visitorsStatsComponent.campaignId)
            visitorsFilter.push({ CampaignId: this.visitorsStatsComponent.campaignId });
        if (this.visitorsStatsComponent.quickSearch)
            visitorsFilter.push(this.getSearchFilter(['FirstName', 'LastName', 'Email', 'PhoneNumber'], this.visitorsStatsComponent.quickSearch));

        this.processODataFilter(this.visitorsStatsComponent.dataGrid.instance, 'PfmOfferRequest', visitorsFilter, (filter) => filter);
    }

    yearSelectionChanged() {
        this.initHeadlineButtons();
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
    }

}
