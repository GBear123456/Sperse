/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTooltipComponent } from 'devextreme-angular/ui/tooltip';
import { Observable, of } from 'rxjs';
import { CacheService } from 'ng2-cache-service';
import { ImageViewerComponent } from 'ng2-image-viewer';
import '@node_modules/ng2-image-viewer/imageviewer.js';
import { flatMap, finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { FileSizePipe } from '@shared/common/pipes/file-size.pipe';
import { ReportsServiceProxy, ReportPeriod, GetReportUrlOutput } from '@shared/service-proxies/service-proxies';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { StringHelper } from '@root/shared/helpers/StringHelper';
import { RequestHelper } from '@root/shared/helpers/RequestHelper';
import { ReportViewType } from './report-view-type.enum';
import { GenerateReportDialogComponent } from './generate-report-dialog/generate-report-dialog.component';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { AppService } from '@app/app.service';
import { SendNotificationDialogComponent } from '@app/cfo/reports/send-notification-dialog/send-notification-dialog.component';
import { DataGridService } from '@app/shared/common/data-grid.service.ts/data-grid.service';

@Component({
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.less'],
    providers: [ ReportsServiceProxy, FileSizePipe ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(DxTooltipComponent) actionsTooltip: DxTooltipComponent;
    @ViewChild(ImageViewerComponent) imageViewer: ImageViewerComponent;

    headlineConfig;
    toolbarConfig: any = [];
    menuItems = [
        {
            caption: 'MonthlyReports',
            period: ReportPeriod.Monthly,
            isAlwaysActive: true,
            onClick: this.onMenuClick.bind(this)
        },
        {
            caption: 'QuarterlyReports',
            period: ReportPeriod.Quarterly,
            isAlwaysActive: true,
            onClick: this.onMenuClick.bind(this)
        },
        {
            caption: 'AnnualReports',
            period: ReportPeriod.Annual,
            isAlwaysActive: true,
            onClick: this.onMenuClick.bind(this)
        }
    ];

    visibleReports: any[];
    viewerToolbarConfig: any = [];
    actionMenuItems: any = [
        {
            text: this.l('Download'),
            action: this.downloadReport.bind(this)
        },
        {
            text: this.l('Reports_SendNotification'),
            action: this.openSendNotificationDialog.bind(this),
            visible: !this._cfoService.isMainInstanceType
        },
        {
            text: this.l('Delete'),
            action: this.deleteReport.bind(this)
        }
    ];
    actionRecordData: any;
    currentReportInfo: any;
    openReportMode = false;
    previewContent: string;
    reportUrls = {};

    selectedPeriod = ReportPeriod.Monthly;
    formatting = AppConsts.formatting;
    dataSourceURI = 'Reporting';

    readonly RESERVED_TIME_SECONDS = 30;

    constructor(
        private injector: Injector,
        private _appService: AppService,
        private _dialog: MatDialog,
        private _fileSizePipe: FileSizePipe,
        private _changeDetector: ChangeDetectorRef,
        private cacheService: CacheService,
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
        this.initToolbarConfig();
    }

    private openSendNotificationDialog() {
        this._dialog.open(SendNotificationDialogComponent, {
            panelClass: 'slider',
            data: { reportId: this.currentReportInfo.Id }
        });
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
                            placeholder: this.l('Search'),
                            onValueChanged: (e) => {
                                this.searchValueChange(e);
                            }
                        }
                    }
                ]
            },
            {
                location: 'after',
                locateInMenu: 'auto',
                items: [
                    {
                        name: 'showCompactRowsHeight',
                        visible: !this._cfoService.hasStaticInstance,
                        action: DataGridService.showCompactRowsHeight.bind(this, this.dataGrid)
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
                                    action: this.exportToXLS.bind(this),
                                    text: this.l('Export to Excel'),
                                    icon: 'xls',
                                },
                                {
                                    action: this.exportToCSV.bind(this),
                                    text: this.l('Export to CSV'),
                                    icon: 'sheet'
                                },
                                {
                                    action: this.exportToGoogleSheet.bind(this),
                                    text: this.l('Export to Google Sheets'),
                                    icon: 'sheet'
                                }
                            ]
                        }
                    },
                    {
                        name: 'columnChooser',
                        visible: !this._cfoService.hasStaticInstance,
                        action: DataGridService.showColumnChooser.bind(this, this.dataGrid)
                    }
                ]
            }
        ];
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.processFilterInternal();
    }

    initViewerToolbar(conf: any = {}) {
        this.viewerToolbarConfig = [
            {
                location: 'before', items: [
                    {
                        name: 'back',
                        action: this.closeReport.bind(this)
                    },
                    {
                        html: `<div class="file-name pdf image" title="${this.currentReportInfo.FileName} ${this._fileSizePipe.transform(this.currentReportInfo.Size)}">
                                    ${this.currentReportInfo.FileName.split('.').shift()}
                               </div>`
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'delete',
                        action: this.deleteReport.bind(this)
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'download',
                        action: this.downloadReport.bind(this)
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'prev',
                        action: e => {
                            this.viewReport.call(this, ReportViewType.Prev, e.event.originalEvent);
                        },
                        disabled: conf.prevButtonDisabled
                    },
                    {
                        name: 'next',
                        action: e => {
                            this.viewReport.call(this, ReportViewType.Next, e.event.originalEvent);
                        },
                        disabled: conf.nextButtonDisabled
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'fullscreen',
                        action: this.showReportFullscreen.bind(this)
                    }
                ]
            },
            {
                location: 'after', items: [
                    {
                        name: 'close',
                        action: this.closeReport.bind(this)
                    }
                ]
            }
        ];
    }

    showReportFullscreen() {
        this.toggleFullscreen(this.getViewedReportElement());
    }

    getViewedReportElement() {
        const viewedReportSelector = '.reportView';
        let viewedReportElement = document.querySelector(viewedReportSelector);
        /** If selector contains iframe - use it at fullScreen */
        const iframe = viewedReportElement.querySelector('iframe');
        if (iframe) {
            viewedReportElement = iframe;
        }
        return viewedReportElement;
    }

    ngAfterViewInit(): void {
        this.activate();
    }

    initHeadlineConfig() {
        this.headlineConfig = {
            names: [this.l('REPORTS')],
            iconSrc: './assets/common/icons/credit-card-icon.svg',
            buttons: [
                {
                    action: this.showGenerateReportDialog.bind(this),
                    lable: this.l('GenerateNewReport'),
                    enabled: this.isInstanceAdmin || this.isMemberAccessManage
                }
            ]
        };
    }

    showGenerateReportDialog() {
        this._dialog.closeAll();
        this._dialog.open(GenerateReportDialogComponent, {
            panelClass: [ 'slider' ],
            disableClose: true,
            hasBackdrop: true,
            closeOnNavigation: true,
            data: {
                instanceType: this.instanceType,
                instanceId: this.instanceId,
                period: this.selectedPeriod,
                reportGenerated: () => this.dataGrid.instance.refresh()
            }
        });
    }

    calculateFileSizeValue = (data) => this._fileSizePipe.transform(data.Size);

    numerizeFileSizeSortValue = (data) => +data.Size;

    onDataGridInit(event) {
        this._changeDetector.markForCheck();
    }

    onCellClick($event) {
        const target = $event.event.target;
        if ($event.rowType === 'data') {
            /** If user click on actions icon */
            if (target.closest('.dx-link.dx-link-edit')) {
                this.showActionsMenu($event.data, target);
            } else {
                this.currentReportInfo = $event.data;
                /** Save sorted visible rows to get next and prev properly */
                this.visibleReports = $event.component.getVisibleRows().map(row => row.data);
                /** If user click the whole row */
                this.viewReport(ReportViewType.Current, $event);
    }
        }
    }

    storeUrlToCache(id: string, urlInfo: GetReportUrlOutput) {
        this.cacheService.set(id, urlInfo,
            { maxAge: urlInfo.validityPeriodSeconds - this.RESERVED_TIME_SECONDS });
    }

    getReportUrlInfoObservable(id: string): Observable<GetReportUrlOutput> {
        if (this.cacheService.exists(id)) {
            let urlInfo = this.cacheService.get(id) as GetReportUrlOutput;
            return of(urlInfo);
        }

        return this.reportsProxy.getUrl(<any>this.instanceType, this.instanceId, id).pipe(
            flatMap((urlInfo) => {
                this.storeUrlToCache(id, urlInfo);
                this.reportUrls[id] = urlInfo.url;
                return of(urlInfo);
            }));
    }

    viewReport(type: ReportViewType = ReportViewType.Current, event?: any) {
        let currentReportIndex = this.visibleReports.indexOf(this.currentReportInfo);
        if (type !== ReportViewType.Current) {
            currentReportIndex = currentReportIndex + type;
            const prevOrNextReport = this.visibleReports[currentReportIndex];
            /** If there is no next or prev report - just don't do any action */
            if (!prevOrNextReport) {
                return;
            }
            this.currentReportInfo = prevOrNextReport;
        }
        super.startLoading(true);
        this.initViewerToolbar({
            prevButtonDisabled: currentReportIndex === 0, // report is first in list
            nextButtonDisabled: currentReportIndex === this.visibleReports.length - 1, // report is last in list
        });
        this.getReportUrlInfoObservable(this.currentReportInfo.Id).subscribe((urlInfo) => {
            RequestHelper.downloadFileBlob(urlInfo.url, (blob) => {
                    let reader = new FileReader();
                    reader.addEventListener('loadend', () => {
                        this.openReportMode = true;
                        this.previewContent = StringHelper.getBase64(reader.result);
                        setTimeout(() => this.showReportFullscreen(), 300);
                        this._changeDetector.markForCheck();
                    });
                    reader.readAsDataURL(blob);
                super.finishLoading(true);
            });
        });
    }

    showActionsMenu(data, target) {
        this.actionRecordData = data;
        setTimeout(() => {
            this.actionsTooltip.instance.show(target);
        });
    }

    hideActionsMenu() {
        if (this.actionsTooltip && this.actionsTooltip.instance) {
            this.actionsTooltip.instance.hide();
        }
    }

    onMenuItemClick($event) {
        this.currentReportInfo = this.actionRecordData;
        $event.itemData.action.call(this);
        this.actionRecordData = null;
    }

    downloadReport() {
        let id = this.currentReportInfo.Id;
        if (this.reportUrls[id])
            window.open(this.reportUrls[id], '_self');
        else {
            this.getReportUrlInfoObservable(id).subscribe((urlInfo) => {
                this.reportUrls[id] = urlInfo.url;
                window.open(urlInfo.url, '_self');
            });
        }
        this.hideActionsMenu();
    }

    deleteReport() {
        this.message.confirm(
            this.l('ReportDeleteWarningMessage', this.currentReportInfo.FileName),
            isConfirmed => {
                if (isConfirmed) {
                    super.startLoading(true);
                    this.reportsProxy.delete(<any>this.instanceType, this.instanceId, this.currentReportInfo.Id)
                        .pipe(finalize(() => super.finishLoading(true)))
                        .subscribe(() => {
                            this.dataGrid.instance.refresh();
                            if (this.actionsTooltip && this.actionsTooltip.visible) {
                                this.hideActionsMenu();
                            }
                            this.closeReport();
                        });
                }
            }
        );
    }

    closeReport() {
        this.openReportMode = false;
        this.previewContent = undefined;
        this.viewerToolbarConfig = [];
        this._changeDetector.markForCheck();
        setTimeout(() => this.dataGrid.instance.repaint());
    }

    onContentReady() {
        this.setGridDataLoaded();
    }

    getFilters() {
        return [
            {Period: this.selectedPeriod}
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
        this.selectedPeriod = item.period;
        this.dataGrid.instance.clearFilter();
        this.processFilterInternal();
        this.dataGrid.instance.repaint();

        if (this.openReportMode) {
            this.openReportMode = false;
            this._changeDetector.markForCheck();
            if (this._dialog) {
                this._dialog.closeAll();
            }
        }
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        if (this.openReportMode) {
            /** Arrow left is pressed */
            if (event.keyCode === 37) {
                this.viewReport(ReportViewType.Prev, event);
            }
            /** Arrow right is pressed */
            if (event.keyCode === 39) {
                this.viewReport(ReportViewType.Next, event);
            }
        }
    }

    ngOnDestroy() {
        this.deactivate();
        this.toolbarConfig = [];
        this.viewerToolbarConfig = [];
        if (this.openReportMode) {
            this.closeReport();
        }
    }

    activate() {
        this.getRootComponent().overflowHidden(true);
    }

    deactivate() {
        this.getRootComponent().overflowHidden();
    }
}
