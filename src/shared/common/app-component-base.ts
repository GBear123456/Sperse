import { Injector, ApplicationRef, ElementRef, HostBinding, HostListener } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { LocalizationService } from '@abp/localization/localization.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { NotifyService } from '@abp/notify/notify.service';
import { SettingService } from '@abp/settings/setting.service';
import { MessageService } from '@abp/message/message.service';
import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ExportService } from '@shared/common/export/export.service';
import { httpConfiguration } from '@shared/http/httpConfiguration';
import { ScreenHelper } from '@shared/helpers/ScreenHelper';
import { PrimengDatatableHelper } from 'shared/helpers/PrimengDatatableHelper';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';
import { environment } from 'environments/environment';
import { FilterModel } from '@shared/filters/models/filter.model';

import buildQuery from 'odata-query';
import * as _ from 'underscore';
import { ODataSearchStrategy } from '@shared/AppEnums';
declare let require: any;
import { PrimengTableHelper } from 'shared/helpers/PrimengTableHelper';

export abstract class AppComponentBase {
    @HostBinding('class.fullscreen') public isFullscreenMode = false;
    dataGrid: any;
    dataSource: any;
    isDataLoaded = false;
    totalRowCount: number;
    totalDataSource: any;
    localization: LocalizationService;
    permission: PermissionCheckerService;
    protected feature: FeatureCheckerService;
    notify: NotifyService;
    setting: SettingService;
    message: MessageService;
    multiTenancy: AbpMultiTenancyService;
    appSession: AppSessionService;
    httpConfig: httpConfiguration;
    primengDatatableHelper: PrimengDatatableHelper;
    primengTableHelper: PrimengTableHelper;
    ui: AppUiCustomizationService;
    loading: boolean;
    appUrlService: AppUrlService;

    public searchValue: string;
    public searchColumns: any[];

    private _elementRef: ElementRef;
    private _applicationRef: ApplicationRef;
    public _exportService: ExportService;
    public capitalize = require('underscore.string/capitalize');

    private static isZendeskWebwidgetSetup = false;
    private static showZendeskWebwidgetTimeout: any;

    public defaultGridPagerConfig = {
        showPageSizeSelector: true,
        allowedPageSizes: [20, 100, 500, 1000],
        showInfo: true,
        visible: true
    };

    constructor(private _injector: Injector,
        public localizationSourceName = AppConsts.localization.defaultLocalizationSourceName
    ) {
        this.localization = _injector.get(LocalizationService);
        this.permission = _injector.get(PermissionCheckerService);
        this.feature = _injector.get(FeatureCheckerService);
        this.notify = _injector.get(NotifyService);
        this.setting = _injector.get(SettingService);
        this.message = _injector.get(MessageService);
        this.multiTenancy = _injector.get(AbpMultiTenancyService);
        this.appSession = _injector.get(AppSessionService);
        this.ui = _injector.get(AppUiCustomizationService);
        this.httpConfig = _injector.get(httpConfiguration);
        this._applicationRef = _injector.get(ApplicationRef);
        this._exportService = _injector.get(ExportService);
        this.primengDatatableHelper = new PrimengDatatableHelper();
    }

    @HostListener('document:webkitfullscreenchange', ['$event'])
    @HostListener('document:mozfullscreenchange', ['$event'])
    @HostListener('document:fullscreenchange', ['$event'])
    onWebkitFullscreenChange($event) {
        this.isFullscreenMode = document['fullScreen']
            || document['mozFullScreen'] || document.webkitIsFullScreen;
    }

    getRootComponent() {
        return this._injector.get(this._applicationRef.componentTypes[0]);
    }

    getElementRef() {
        if (!this._elementRef)
            this._elementRef = this._injector.get(ElementRef);
        return this._elementRef;
    }

    getCacheKey(key) {
        return this.constructor.name + '_' + key;
    }

    l(key: string, ...args: any[]): string {
        args.unshift(key);
        args.unshift(this.localizationSourceName);
        return this.ls.apply(this, args);
    }

    ls(sourcename: string, key: string, ...args: any[]): string {
        let source = abp.localization.values[sourcename];
        if (!source || !source[key])
            sourcename = AppConsts.localization.defaultLocalizationSourceName;

        let localizedText = this.localization.localize(key, sourcename);

        if (!localizedText)

        if (!localizedText) {
            localizedText = key;

        if (!args || !args.length)
            return localizedText;

            args.unshift(localizedText);
            return abp.utils.formatString.apply(this, args);
    }

    getODataURL(uri: String, filter?: Object) {
        return AppConsts.remoteServiceBaseUrl + '/odata/' +
            uri + (filter ? buildQuery({ filter }) : '');
    }

    getODataVersion() {
        return 4;
    }

    advancedODataFilter(grid: any, uri: string, query: any[]) {
        let queryWithSearch = query.concat(this.getSearchFilter());
        let dataSource = grid.getDataSource();
        dataSource['_store']['_url'] = this.getODataURL(uri, queryWithSearch);
        dataSource.load().done(() => grid.repaint());
        return queryWithSearch;
    }

    processODataFilter(grid, uri, filters, getCheckCustom) {
        this.isDataLoaded = false;
        return this.advancedODataFilter(grid, uri,
            filters.map((filter) => {
                return getCheckCustom && getCheckCustom(filter) ||
                    filter.getODataFilterObject();
            })
        );
    }

    getSearchFilter() {
        let data = {};
        let filterData: any[] = [];

        if (this.searchColumns && this.searchValue) {
            let values = FilterModel.getSearchKeyWords(this.searchValue);
            values.forEach((val) => {
                let valueFilterData: any[] = [];
                this.searchColumns.forEach((col) => {
                    let colName = col.name || col;
                    let searchStrategy = col.strategy || ODataSearchStrategy.Contains;
                    let el = this.getFilterExpression(colName, searchStrategy, val);
                    valueFilterData.push(el);
                });

                let elF = {
                    or: valueFilterData
                };
                filterData.push(elF);
            });

            data = {
                and: filterData
            };
        }

        return data;
    }

    isFeatureEnable(featureName: string): boolean {
        return !abp.session.tenantId || !featureName || this.feature.isEnabled(featureName);
    }

    isGranted(permissionName: string): boolean {
        return this.permission.isGranted(permissionName);
    }

    isGrantedAny(...permissions: string[]): boolean {
        if (!permissions) {
            return false;
        }

        for (const permission of permissions) {
            if (this.isGranted(permission)) {
                return true;
            }
        }

        return false;
    }

    s(key: string): string {
        return abp.setting.get(key);
    }

    exportToXLS(option) {
        this.dataGrid.export.fileName = this._exportService.getFileName();
        this.dataGrid.instance.exportToExcel(option == 'selected');
    }

    exportToCSV(option) {
        this._exportService.saveAsCSV(
            this.dataGrid,
            option == 'all'
        );
    }

    exportToGoogleSheet(option) {
        this._exportService.exportToGoogleSheets(
            this.dataGrid, option == 'all');
    }

    toggleFullscreen(element: any) {
        if (this.isFullscreenMode)
            ScreenHelper.exitFullscreen();
        else
            ScreenHelper.openFullscreen(element);
    }

    getPhoto(photo, gender): string {
        if (photo)
            return 'data:image/jpeg;base64,' + photo;
        if (gender)
            return 'assets/common/images/no-photo-' + gender + '.png';

        return 'assets/common/images/no-photo.png';
    }

    startLoading(globally = false) {
        this.loading = true;
        abp.ui.setBusy(globally ? undefined : this.getElementRef().nativeElement);
    }

    finishLoading(globally = false) {
        abp.ui.clearBusy(globally ? undefined : this.getElementRef().nativeElement);
        this.loading = false;
    }

    showHostElement() {
        setTimeout(() => {
            this.getElementRef().nativeElement
                .style.display = 'block';
        }, 100);
    }

    hideHostElement() {
        this.getElementRef().nativeElement
            .style.display = 'none';
    }

    private getFilterExpression(colName: string, strategy: string, value: string): object {
        let el = {};
        el[colName] = {};

        switch (strategy) {
            case ODataSearchStrategy.Contains:
            case ODataSearchStrategy.StartsWith:
                el[colName][strategy] = value;
                break;
            case ODataSearchStrategy.Equals:
            default:
                el[colName] = value;
        }
        return el;
    }

    protected setTitle(moduleName: string) {
        let rootComponent: any = this.getRootComponent();
        rootComponent.setTitle(this.appSession.tenantName, moduleName);
    }

    protected setGridDataLoaded() {
        let gridInstance = this.dataGrid && this.dataGrid.instance;
        if (gridInstance) {
            let dataSource = gridInstance.getDataSource();
            this.isDataLoaded = dataSource.isLoaded();
            this.totalRowCount = dataSource.totalCount();
        }
    }

    protected calculateDialogPosition(event, parent, shiftX, shiftY) {
        if (parent) {
            let rect = parent.getBoundingClientRect();
            return {
                top: (rect.top + rect.height / 2 - shiftY) + 'px',
                left: (rect.left + rect.width / 2 - shiftX) + 'px'
            };
        } else {
            return {
                top: event.clientY - shiftY + 'px',
                left: event.clientX - shiftX + 'px'
            };
        }
    }

    private static zendeskWebwidgetSetup(service: ngxZendeskWebwidgetService) {
        if (AppComponentBase.isZendeskWebwidgetSetup) {
            return;
        }

        service.setSettings(
            {
                webWidget: {
                    launcher: {
                        label: {
                            '*': abp.localization.localize('QuestionsOrFeedback',
                                AppConsts.localization.defaultLocalizationSourceName)
                        }
                    }
                }
            }
        );

        AppComponentBase.isZendeskWebwidgetSetup = true;
    }

    protected static zendeskWebwidgetShow(service: ngxZendeskWebwidgetService) {
        if (environment.zenDeskEnabled) {
            AppComponentBase.zendeskWebwidgetSetup(service);
            this.showZendeskWebwidgetTimeout = setTimeout(() => {
                service.show();
            }, 2000);
        }
    }

    protected static zendeskWebwidgetHide(service: ngxZendeskWebwidgetService) {
        if (environment.zenDeskEnabled) {
            clearTimeout(this.showZendeskWebwidgetTimeout);
            service.hide();
        }
    }

    appRootUrl(): string {
        return this.appUrlService.appRootUrl;
    }
}
