/** Core imports */
import { Injector, ApplicationRef, ElementRef, HostBinding, HostListener, OnDestroy } from '@angular/core';

/** Third party imports */
import * as _ from 'underscore';
import { Subject, Observable } from 'rxjs';

/** Application imports */
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { LocalizationService } from '@abp/localization/localization.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { NotifyService } from '@abp/notify/notify.service';
import { SettingService } from '@abp/settings/setting.service';
import { MessageService } from '@abp/message/message.service';
import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ExportService } from '@shared/common/export/export.service';
import { ScreenHelper } from '@shared/helpers/ScreenHelper';
import { PrimengTableHelper } from 'shared/helpers/PrimengTableHelper';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { ODataService } from '@shared/common/odata/odata.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';

declare let require: any;

export abstract class AppComponentBase implements OnDestroy {
    @HostBinding('class.fullscreen') public isFullscreenMode = false;
    private destroySubject: Subject<boolean> = new Subject<boolean>();
    destroy$: Observable<boolean> = this.destroySubject.asObservable();
    private deactivateSubject: Subject<boolean> = new Subject<boolean>();
    deactivate$: Observable<boolean> = this.deactivateSubject.asObservable();
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
    httpInterceptor: AppHttpInterceptor;
    primengTableHelper: PrimengTableHelper;
    ui: AppUiCustomizationService;
    loading: boolean;
    appUrlService: AppUrlService;
    localizationService: AppLocalizationService;
    oDataService: ODataService;

    public searchClear = true;
    public searchValue: string;
    public searchColumns: any[];

    private _prevScrollPos: any;
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
        this.httpInterceptor = _injector.get(AppHttpInterceptor);
        this._applicationRef = _injector.get(ApplicationRef);
        this._exportService = _injector.get(ExportService);
        this.primengTableHelper = new PrimengTableHelper();
        this.appUrlService = _injector.get(AppUrlService);
        this.localizationService = _injector.get(AppLocalizationService);
        this.oDataService = this._injector.get(ODataService);
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
        return this.localizationService.l(key, this.localizationSourceName, ...args);
    }

    ls(sourcename: string, key: string, ...args: any[]): string {
        return this.localizationService.ls(sourcename, key, ...args);
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

    exportTo(option, type) {
        this.startLoading();
        return this._exportService['exportTo' + type](
            this.dataGrid, option == 'all'
        ).then(() => this.finishLoading());
    }

    exportToXLS(option) {
        return this.exportTo(option, 'Excel');
    }

    exportToCSV(option) {
        return this.exportTo(option, 'CSV');
    }

    exportToGoogleSheet(option) {
        return this.exportTo(option, 'GoogleSheets');
    }

    toggleFullscreen(element: any) {
        if (this.isFullscreenMode)
            ScreenHelper.exitFullscreen();
        else
            ScreenHelper.openFullscreen(element);
    }

    getPhoto(photo, gender = null): string {
        if (photo)
            return this.getImageBase64Src(photo);
        if (gender)
            return 'assets/common/images/no-photo-' + gender + '.png';

        return AppConsts.imageUrls.noPhoto;
    }

    getImageBase64Src(imageBase64: string): string {
        return 'data:image/jpeg;base64,' + imageBase64;
    }

    getProfilePictureUrl(id, defaultUrl = AppConsts.imageUrls.profileDefault) {
        if (!id)
            return defaultUrl;

        let tenantId = this.appSession.tenantId;
        return AppConsts.remoteServiceBaseUrl + '/api/Profile/Picture/' + (tenantId || 0) + '/' + id;
    }

    startLoading(globally = false, element: any = null) {
        this.loading = true;
        abp.ui.setBusy(globally ? undefined : (element || this.getElementRef().nativeElement));
    }

    finishLoading(globally = false, element: any = null) {
        abp.ui.clearBusy(globally ? undefined : (element || this.getElementRef().nativeElement));
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

    invalidate() {
        if (this.dataGrid && this.dataGrid.instance)
            this.dataGrid.instance.refresh();
    }

    protected setTitle(moduleName: string) {
        let rootComponent: any = this.getRootComponent();
        rootComponent.setTitle(this.appSession.tenantName, moduleName);
    }

    protected setGridDataLoaded() {
        let gridInstance = this.dataGrid && this.dataGrid.instance;
        if (gridInstance) {
            let dataSource = gridInstance.getDataSource();
            if (dataSource) {
                this.isDataLoaded = dataSource.isLoaded();
                this.totalRowCount = dataSource.totalCount();
            }
        }
    }

    appRootUrl(): string {
        return this.appUrlService.appRootUrl;
    }

    getODataUrl(uri: String, filter?: Object, instanceData = null) {
        return this.oDataService.getODataUrl(uri, filter, instanceData);
    }

    processODataFilter(grid, uri, filters, getCheckCustom, instanceData = null) {
        this.isDataLoaded = false;
        return this.oDataService.processODataFilter(grid, uri, filters, getCheckCustom, this.searchColumns, this.searchValue, instanceData);
    }

    getSearchFilter() {
        return this.oDataService.getSearchFilter(this.searchColumns, this.searchValue);
    }

    activate() {
        if (this.searchValue && this.searchClear) {
            this.searchValue = '';
            this.invalidate();
        } if (this.dataGrid && this.dataGrid.instance) {
            let scroll = this.dataGrid.instance.getScrollable();
            if (scroll) {
                setTimeout(() => {
                    scroll.update();
                    if (this._prevScrollPos)
                        scroll.scrollTo(this._prevScrollPos);
                }, 200);
            }
        }
        this.searchClear = true;
    }

    deactivate() {
        this.deactivateSubject.next(true);
        if (this.dataGrid && this.dataGrid.instance) {
            let scroll = this.dataGrid.instance.getScrollable();
            if (scroll)
                this._prevScrollPos = scroll.scrollOffset();
        }
    }

    ngOnDestroy() {
        this.destroySubject.next(true);
        this.destroySubject.unsubscribe();
        this.deactivateSubject.unsubscribe();
    }
}
