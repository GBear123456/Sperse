/** Core imports */
import { Component, Injector, OnInit, AfterViewInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { Observable, of } from 'rxjs';
import { CacheService } from 'ng2-cache-service';
import { ImageViewerComponent } from 'ng2-image-viewer';
import { flatMap, finalize, map } from 'rxjs/operators';
import findIndex from 'lodash/findIndex';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { NavigationState } from '@shared/AppEnums';
import { FileSizePipe } from '@shared/common/pipes/file-size.pipe';
import { DepartmentsServiceProxy, ReportsServiceProxy, GetReportUrlOutput, ReportTemplate } from '@shared/service-proxies/service-proxies';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { StringHelper } from '@root/shared/helpers/StringHelper';
import { RequestHelper } from '@root/shared/helpers/RequestHelper';
import { GenerateReportDialogComponent } from './generate-report-dialog/generate-report-dialog.component';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { SendNotificationDialogComponent } from '@app/cfo/reports/send-notification-dialog/send-notification-dialog.component';
import { FilterCheckBoxesComponent } from '@shared/filters/check-boxes/filter-check-boxes.component';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { AppFeatures } from '@shared/AppFeatures';
import { HeadlineButton } from '@app/shared/common/headline/headline-button.model';
import { ActionMenuComponent } from '@app/shared/common/action-menu/action-menu.component';
import { ToolbarGroupModel } from '@app/shared/common/toolbar/toolbar.model';
import { AppService } from '@app/app.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { LeftMenuItem } from '@app/shared/common/left-menu/left-menu-item.interface';
import { ReportFields } from '@app/cfo/reports/report-fields.enum';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ReportDto } from '@app/cfo/reports/report-dto.interface';
import { ReportType } from './enums/reportType.enum';
import { ReportPeriod } from './enums/reportPeriod.enum';

@Component({
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.less'],
    providers: [ ReportsServiceProxy, FileSizePipe, DepartmentsServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ActionMenuComponent) actionMenu: ActionMenuComponent;
    @ViewChild(ImageViewerComponent) imageViewer: ImageViewerComponent;

    headlineButtons: HeadlineButton[] = [
        {
            action: this.showGenerateReportDialog.bind(this),
            label: this.l('GenerateNewReport'),
            enabled: this.isInstanceAdmin || this.isMemberAccessManage
        }
    ];
    menuItems: LeftMenuItem[] = [
        {
            caption: this.l('AllReports'),
            data: {
                period: undefined,
            },
            iconSrc: './assets/common/icons/reports/monthly-reports.svg',
            onClick: this.onMenuClick.bind(this)
        },
        {
            caption: this.l('MonthlyReports'),
            data: {
                period: ReportPeriod.Monthly
            },
            iconSrc: './assets/common/icons/reports/monthly-reports.svg',
            onClick: this.onMenuClick.bind(this)
        },
        {
            caption: this.l('QuarterlyReports'),
            data: {
                period: ReportPeriod.Quarterly,
            },
            iconSrc: './assets/common/icons/reports/quarterly-reports.svg',
            onClick: this.onMenuClick.bind(this)
        },
        {
            data: {
                period: ReportPeriod.Annual
            },
            iconSrc: './assets/common/icons/reports/annual-reports.svg',
            caption: this.l('AnnualReports'),
            onClick: this.onMenuClick.bind(this)
        }
    ];

    get selectedPeriodIndex(): number {
        return findIndex(<any>this.menuItems, (item: LeftMenuItem) => item.data.period == this.selectedPeriod);
    }

    visibleReports: ReportDto[];
    viewerToolbarConfig: any = [];
    actionMenuItems: any = [
        {
            text: this.l('Download'),
            class: 'download',
            action: this.downloadReport.bind(this)
        },
        {
            text: this.l('Reports_SendNotification'),
            class: 'send-notification',
            action: this.openSendNotificationDialog.bind(this)
        },
        {
            text: this.l('Delete'),
            class: 'delete',
            action: this.deleteReport.bind(this)
        }
    ];
    actionRecordData: any;
    currentReportInfo: ReportDto;
    openReportMode = false;
    previewContent: string = '';
    reportUrls = {};

    filters: FilterModel[];
    departmentsFilterModel: FilterModel;
    selectedPeriod = undefined;
    formatting = AppConsts.formatting;
    dataSourceURI = 'Reporting';
    noDepartmentItem = this.l('NoDepartment');
    hasDepartmentsFeature = this.feature.isEnabled(AppFeatures.CFODepartmentsManagement);
    showDepartmentFilter = this.hasDepartmentsFeature && this._cfoService.accessAllDepartments;

    readonly RESERVED_TIME_SECONDS = 30;
    toolbarConfig: ToolbarGroupModel[];
    showToggleCompactViewButton: boolean = !this._cfoService.hasStaticInstance;
    readonly reportsFields: KeysEnum<ReportDto> = ReportFields;

    typeHeaderFilter = [];
    templateHeaderFilter = [];

    constructor(
        private injector: Injector,
        private dialog: MatDialog,
        private fileSizePipe: FileSizePipe,
        private changeDetector: ChangeDetectorRef,
        private cacheService: CacheService,
        private filtersService: FiltersService,
        private departmentsProxy: DepartmentsServiceProxy,
        public appService: AppService,
        public reportsProxy: ReportsServiceProxy,
        public bankAccountsService: BankAccountsService
    ) {
        super(injector);
        this.dataSource = new DataSource({
            store: new ODataStore({
                key: this.reportsFields.Id,
                url: this.getODataUrl(this.dataSourceURI, this.getFilters()),
                version: AppConsts.ODataVersion,
                beforeSend: (request) => {
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                    request.params.$select = DataGridService.getSelectFields(this.dataGrid, [ this.reportsFields.Id ]);
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

                    if (this.departmentsFilterModel && this.departmentsFilterModel.items.element.value.length) {
                        request.url += '&' + this.departmentsFilterModel.items.element.value.map(item => {
                            return 'departments=' + (item == this.noDepartmentItem ? '' : item);
                        }).join('&');
                    }
                }
            })
        });
        this.initHeaderFilterValues();
    }

    ngOnInit(): void {
        this.initToolbarConfig();
    }

    private openSendNotificationDialog() {
        this.dialog.open(SendNotificationDialogComponent, {
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
                        name: 'filters',
                        visible: this.showDepartmentFilter && !this.isAdvicePeriod && !this._cfoService.hasStaticInstance,
                        action: () => {
                            this.filtersService.fixed = !this.filtersService.fixed;
                        },
                        options: {
                            checkPressed: () => {
                                return this.filtersService.fixed;
                            },
                            mouseover: () => {
                                this.filtersService.enable();
                            },
                            mouseout: () => {
                                if (!this.filtersService.fixed)
                                    this.filtersService.disable();
                            }
                        },
                        attr: {
                            'filter-selected': this.filtersService.hasFilterSelected
                        }
                    }
                ]
            }, {
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
            }
        ];
    }

    searchValueChange(e: object) {
        this.searchValue = e['value'];
        this.processFilterInternal();
    }

    setupFilters() {
        if (!this.showDepartmentFilter)
            return;

        if (this.filters && this.filters.length)
            this.filtersService.setup(this.filters);
        else
            this.filtersService.setup(
                this.filters = [
                    this.departmentsFilterModel = new FilterModel({
                        component: FilterCheckBoxesComponent,
                        caption: 'departments',
                        field: 'departments',
                        items: {
                            element: new FilterCheckBoxesModel({
                                dataSource$: this.departmentsProxy.getAccessibleDepartments(
                                    this._cfoService.instanceType, this._cfoService.instanceId).pipe(map(items => {
                                        items.unshift(this.noDepartmentItem);
                                        return items.map(item => {
                                            return {name: item};
                                        });
                                    })
                                ),
                                nameField: 'name',
                                keyExpr: 'name'
                            })
                        }
                    })
                ]
            );

        this.filtersService.apply(() => {
            this.initToolbarConfig();
            this.processFilterInternal();
        });
    }

    initHeaderFilterValues() {
        this.typeHeaderFilter = Object.keys(ReportType).map(item => {
            return {
                text: this.l('ReportTypes_' + item),
                value: ["Type", "=", item]
            }
        });
        this.templateHeaderFilter = Object.keys(ReportTemplate).map(item => {
            return {
                text: this.l('ReportTemplates_' + item),
                value: ["Template", "=", item]
            }
        });
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
                        html: `<div class="file-name pdf image" title="${this.currentReportInfo.FileName} ${this.fileSizePipe.transform(this.currentReportInfo.Size)}">
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
                        action: () => {
                            this.viewReport.call(this, NavigationState.Prev);
                        },
                        disabled: conf.prevButtonDisabled
                    },
                    {
                        name: 'next',
                        action: () => {
                            this.viewReport.call(this, NavigationState.Next);
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
        this.fullScreenService.toggleFullscreen(this.getViewedReportElement());
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

    showGenerateReportDialog() {
        this.dialog.closeAll();
        this.dialog.open(GenerateReportDialogComponent, {
            panelClass: [ 'slider' ],
            disableClose: true,
            hasBackdrop: true,
            closeOnNavigation: true,
            data: {
                instanceType: this.instanceType,
                instanceId: this.instanceId,
                period: this.selectedPeriod,
                reportGenerated: (reportPeriod) => {
                    if (reportPeriod) {
                        this.onMenuClick(this.menuItems.find(
                            item => item.data.period == reportPeriod)
                        );
                    }
                    else {
                        this.invalidate();
                    }
                }
            }
        });
    }

    calculateFileSizeValue = (data) => this.fileSizePipe.transform(data.Size);

    numerizeFileSizeSortValue = (data) => +data.Size;

    formatDepartments(departments: string[]): string {
        if (departments && departments.length)
            return departments.map(x => x || this.l('NoDepartment')).join(', ');
        return null;
    }

    onDataGridInit() {
        this.changeDetector.markForCheck();
    }

    onCellClick($event) {
        const target = $event.event.target;
        if ($event.rowType === 'data') {
            const report: ReportDto = $event.data;
            /** If user click on actions icon */
            if (target.closest('.dx-link.dx-link-edit')) {
                this.toggleActionsMenu(report, target);
            } else if (report.FileName.endsWith('pdf')) {
                this.currentReportInfo = report;
                /** Save sorted visible rows to get next and prev properly */
                this.visibleReports = $event.component.getVisibleRows().map(row => row.data);
                /** If user click the whole row */
                this.viewReport(NavigationState.Current);
            } else {
                this.currentReportInfo = report;
                this.downloadReport();
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
            flatMap((urlInfo: GetReportUrlOutput) => {
                this.storeUrlToCache(id, urlInfo);
                this.reportUrls[id] = urlInfo.url;
                return of(urlInfo);
            }));
    }

    viewReport(state: NavigationState = NavigationState.Current) {
        super.startLoading(true);
        let dataSource = this.dataGrid.instance.getDataSource();
        let currentReportIndex = this.visibleReports.indexOf(this.currentReportInfo) + state;
        if (this.currentReportInfo = this.visibleReports[currentReportIndex])
            this.initViewerToolbar({
                prevButtonDisabled: currentReportIndex === 0 && !dataSource.pageIndex(), // report is first in list
                nextButtonDisabled: currentReportIndex === this.visibleReports.length - 1 && dataSource.isLastPage(), // report is last in list
            });
        else {
            if (state == NavigationState.Next && dataSource.isLastPage() ||
                state == NavigationState.Prev && !dataSource.pageIndex()
            )
                return ;

            dataSource.pageIndex(dataSource.pageIndex() + state);
            return dataSource.load().then(() => {
                this.visibleReports = this.dataGrid.instance.getVisibleRows().map(row => row.data);
                this.currentReportInfo = this.visibleReports[(state == NavigationState.Next ? 0 : dataSource.pageSize() - 1)];
                this.viewReport();
            });
        }

        this.getReportUrlInfoObservable(this.currentReportInfo.Id).subscribe((urlInfo) => {
            RequestHelper.downloadFileBlob(urlInfo.url, (blob) => {
                    let reader = new FileReader();
                    reader.addEventListener('loadend', () => {
                        if (!this.openReportMode)
                            setTimeout(() => this.showReportFullscreen(), 300);
                        this.openReportMode = true;
                        this.previewContent = StringHelper.getBase64(reader.result as string);
                        this.changeDetector.markForCheck();
                    });
                    reader.readAsDataURL(blob);
                super.finishLoading(true);
            });
        });
    }

    toggleActionsMenu(data, target) {
        this.actionRecordData = data;
        this.actionMenu.toggle(target);
    }

    hideActionsMenu() {
        this.actionMenu.hide();
    }

    onMenuItemClick($event) {
        this.currentReportInfo = this.actionRecordData;
        $event.itemData.action.call(this);
        this.actionRecordData = null;
        this.hideActionsMenu();
    }

    downloadReport() {
        let id = this.currentReportInfo.Id;
        if (this.reportUrls[id])
            window.open(this.reportUrls[id], '_blank');
        else {
            this.getReportUrlInfoObservable(id).subscribe((urlInfo: GetReportUrlOutput) => {
                this.reportUrls[id] = urlInfo.url;
                window.open(urlInfo.url, '_blank');
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
                            this.invalidate();
                            if (this.actionMenu && this.actionMenu.visible) {
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
        this.changeDetector.markForCheck();
        setTimeout(() => this.dataGrid.instance.repaint());
    }

    getFilters() {
        return [
            { Period: this.selectedPeriod }
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

    onMenuClick(item: LeftMenuItem) {
        this.selectedPeriod = item.data.period;
        this.dataGrid.instance.clearFilter();
        this.processFilterInternal();
        this.dataGrid.instance.repaint();

        if (this.openReportMode) {
            this.openReportMode = false;
            this.changeDetector.markForCheck();
            if (this.dialog) {
                this.dialog.closeAll();
            }
        }
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        if (this.openReportMode) {
            /** Arrow left is pressed */
            if (event.keyCode === 37) {
                this.viewReport(NavigationState.Prev);
            }
            /** Arrow right is pressed */
            if (event.keyCode === 39) {
                this.viewReport(NavigationState.Next);
            }
        }
    }

    toggleCompactView() {
        DataGridService.toggleCompactRowsHeight(this.dataGrid, true);
    }

    onLeftMenuToggle() {
        if (this.dataGrid) {
            setTimeout(() => this.dataGrid.instance.repaint(), 1001);
        }
    }

    ngOnDestroy() {
        this.deactivate();
        this.viewerToolbarConfig = [];
        if (this.openReportMode) {
            this.closeReport();
        }
    }

    activate() {
        setTimeout(() =>
            this.changeDetector.markForCheck(), 600);
        this.getRootComponent().overflowHidden(true);
        this.setupFilters();
    }

    deactivate() {
        this.getRootComponent().overflowHidden();
        this.filtersService.unsubscribe();
    }
}
