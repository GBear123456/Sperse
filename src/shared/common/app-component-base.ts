import { Injector, Inject, Input, ApplicationRef, ElementRef, HostBinding, HostListener } from '@angular/core';
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
import { AppService } from '@app/app.service';


import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';

import buildQuery from 'odata-query';
import * as _ from 'underscore';

export abstract class AppComponentBase {
    @HostBinding('class.fullscreen') public isFullscreenMode = false;
    dataGrid: any;
    dataSource: any;
    isDataLoaded = false;
    totalRowCount: number;
    totalDataSource: any;
    localization: LocalizationService;
    protected permission: PermissionCheckerService;
    protected feature: FeatureCheckerService;
    notify: NotifyService;
    setting: SettingService;
    message: MessageService;
    multiTenancy: AbpMultiTenancyService;
    appSession: AppSessionService;
    httpConfig: httpConfiguration;
    primengDatatableHelper: PrimengDatatableHelper;
    ui: AppUiCustomizationService;
    loading: boolean;

    public searchValue: string;
    public searchColumns: string[];

    private _elementRef: ElementRef;
    private _applicationRef: ApplicationRef;
    public _exportService: ExportService;
    public capitalize = require('underscore.string/capitalize');

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

    l(key: string, ...args: any[]): string {
        return this.ls(this.localizationSourceName, key, ...args);
    }

    ls(sourcename: string, key: string, ...args: any[]): string {
        let source = abp.localization.values[sourcename];
        if (!source || !source[key])
            sourcename = AppConsts.localization.defaultLocalizationSourceName;

        let localizedText = this.localization.localize(key, sourcename);

        if (!localizedText)
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
        grid.getDataSource()['_store']['_url'] =
            this.getODataURL(uri, queryWithSearch);

        grid.refresh();
        return queryWithSearch;
    }

    processODataFilter(grid, uri, filters, getCheckCustom) {
        this.isDataLoaded = false;
        return this.advancedODataFilter(grid, uri,
            filters.map((filter) => {
                return getCheckCustom(filter) ||
                    filter.getODataFilterObject();
            })
        );
    }

    getSearchFilter() {
        let data = {};
        let filterData: any[] = [];

        if (this.searchColumns && this.searchValue) {
            let values = FilterModel.getSearchKeyWords(this.searchValue);
            this.searchColumns.forEach((col) => {
                let colFilterData: any[] = [];

                values.forEach((val) => {
                    let el = {};
                    el[col] = {
                        contains: val
                    };
                    colFilterData.push(el);
                });

                let elF = {
                    and: colFilterData
                };

                filterData.push(elF);
            });

            data = {
                or: filterData
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
        this.dataGrid.export.fileName =
            this._exportService.getFileName();
        this.dataGrid.instance
          .exportToExcel(option == 'selected');
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

    protected calculateDialogPosition(event, parent, shiftY) {
        if (parent) {
            let rect = parent.getBoundingClientRect();
            return {
                top: (rect.top + rect.height / 2 - shiftY) + 'px',
                left: (rect.left + rect.width / 2) + 'px'
            };
        } else {
            return {
                top: event.clientY - shiftY + 'px',
                left: event.clientX + 'px'
            };
        }
    }
}
