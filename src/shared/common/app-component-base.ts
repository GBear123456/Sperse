/** Core imports */
import { Injector, ApplicationRef, ElementRef, HostBinding, OnDestroy, Directive } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import capitalize from 'underscore.string/capitalize';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { LocalizationService } from 'abp-ng2-module';
import { FeatureCheckerService } from 'abp-ng2-module';
import { NotifyService } from 'abp-ng2-module';
import { SettingService } from 'abp-ng2-module';
import { MessageService } from 'abp-ng2-module';
import { AbpMultiTenancyService } from 'abp-ng2-module';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ExportService } from '@shared/common/export/export.service';
import { PrimengTableHelper } from 'shared/helpers/PrimengTableHelper';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { ODataService } from '@shared/common/odata/odata.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppPermissions } from '@shared/AppPermissions';
import { FullScreenService } from '@shared/common/fullscreen/fullscreen.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { TitleService } from '@shared/common/title/title.service';
import { DataGridService } from '@app/shared/common/data-grid.service/data-grid.service';
import { InstanceModel } from '@shared/cfo/instance.model';
import { Param } from '@shared/common/odata/param.model';

@Directive()
export abstract class AppComponentBase implements OnDestroy {
    @HostBinding('class.fullscreen') public isFullscreenMode;
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
    permission: AppPermissionService;
    protected feature: FeatureCheckerService;
    notify: NotifyService;
    setting: SettingService;
    message: MessageService;
    multiTenancy: AbpMultiTenancyService;
    appSession: AppSessionService;
    httpInterceptor: AppHttpInterceptor;
    primengTableHelper: PrimengTableHelper;
    ui: AppUiCustomizationService;
    profileService: ProfileService;
    fullScreenService: FullScreenService;
    loading: boolean;
    appUrlService: AppUrlService;
    localizationService: AppLocalizationService;
    oDataService: ODataService;
    titleService: TitleService;
    protected _activatedRoute: ActivatedRoute;
    protected _router: Router;
    get componentIsActivated(): boolean {
        return this._activatedRoute['_routerState'].snapshot.url === this._router.url;
    }
    get exportService() {
        if (!this._exportService)
           this._exportService = this._injector.get(ExportService);
        return this._exportService;
    }

    public searchClear = true;
    public searchValue: string;
    public searchColumns: any[];

    private _prevScrollPos: any;
    private _elementRef: ElementRef;
    private _applicationRef: ApplicationRef;
    private _exportService: ExportService;

    public capitalize = capitalize;
    public userTimezone = '0000';
    public cacheHelper: CacheHelper;
    public loadingService: LoadingService;
    public defaultGridPagerConfig = DataGridService.defaultGridPagerConfig;

    constructor(
        private _injector: Injector
    ) {
        this.localization = _injector.get(LocalizationService);
        this.permission = _injector.get(AppPermissionService);
        this.feature = _injector.get(FeatureCheckerService);
        this.notify = _injector.get(NotifyService);
        this.setting = _injector.get(SettingService);
        this.message = _injector.get(MessageService);
        this.multiTenancy = _injector.get(AbpMultiTenancyService);
        this.appSession = _injector.get(AppSessionService);
        this.ui = _injector.get(AppUiCustomizationService);
        this.httpInterceptor = _injector.get(AppHttpInterceptor);
        this._applicationRef = _injector.get(ApplicationRef);
        this.primengTableHelper = new PrimengTableHelper();
        this.appUrlService = _injector.get(AppUrlService);
        this.localizationService = _injector.get(AppLocalizationService);
        this.oDataService = this._injector.get(ODataService);
        this._activatedRoute = _injector.get(ActivatedRoute);
        this._router = _injector.get(Router);
        this.cacheHelper = _injector.get(CacheHelper);
        this.loadingService = _injector.get(LoadingService);
        this.profileService = _injector.get(ProfileService);
        this.userTimezone = DateHelper.getUserTimezone();
        this.fullScreenService = _injector.get(FullScreenService);
        this.titleService = _injector.get(TitleService);
        this.fullScreenService.isFullScreenMode$
            .pipe(takeUntil(this.destroy$))
            .subscribe((isFullScreenMode: boolean) => {
                this.isFullscreenMode = isFullScreenMode;
            });
    }

    getRootComponent() {
        return this._injector.get(this._applicationRef.componentTypes[0]);
    }

    getElementRef() {
        if (!this._elementRef)
            this._elementRef = this._injector.get(ElementRef);
        return this._elementRef;
    }

    getCacheKey(key: string, prefix?: string): string {
        return this.cacheHelper.getCacheKey(key, prefix);
    }

    l(key: string, ...args: any[]): string {
        return this.localizationService.l(key, ...args);
    }

    ls(sourcename: string, key: string, ...args: any[]): string {
        return this.localizationService.ls(sourcename, key, ...args);
    }

    isGranted(permissionName: AppPermissions): boolean {
        return this.permission.isGranted(permissionName);
    }

    s(key: string): string {
        return abp.setting.get(key);
    }

    exportToXLS(option, dataGrid: DxDataGridComponent = null, prefix?: string, showItemsInName?: boolean) {
        return this.exportService.exportToXLS(option, dataGrid || this.dataGrid, prefix, showItemsInName);
    }

    exportToCSV(option, dataGrid: DxDataGridComponent = null, prefix?: string, showItemsInName?: boolean) {
        return this.exportService.exportToCSV(option, dataGrid || this.dataGrid, prefix, showItemsInName);
    }

    exportToGoogleSheet(option, dataGrid: DxDataGridComponent = null, prefix?: string, showItemsInName?: boolean) {
        return this.exportService.exportToGoogleSheet(option, dataGrid || this.dataGrid, prefix, showItemsInName);
    }

    startLoading(globally = false, element: any = null) {
        this.loading = true;
        this.loadingService.startLoading(globally ? null : element || this.getElementRef().nativeElement);
    }

    finishLoading(globally = false, element: any = null) {
        this.loadingService.finishLoading(globally ? null : element || this.getElementRef().nativeElement);
        this.loading = false;
    }

    showHostElement(callback?) {
        setTimeout(() => {
            this.getElementRef().nativeElement.style.display = 'block';
            this.dataGrid && this.dataGrid.instance && this.dataGrid.instance.repaint();
            callback && callback();
        }, 100);
    }

    hideHostElement() {
        this.getElementRef().nativeElement
            .style.display = 'none';
    }

    invalidate() {
        if (this.dataGrid && this.dataGrid.instance) {
            this.isDataLoaded = false;
            this.dataGrid.instance.refresh();
        }
    }

    protected setTitle(moduleName: string) {
        this.titleService.setTitle(moduleName);
    }

    setGridDataLoaded() {
        let gridInstance = this.dataGrid && this.dataGrid.instance;
        if (gridInstance) {
            let dataSource = gridInstance.getDataSource && gridInstance.getDataSource();
            if (dataSource) {
                this.isDataLoaded = dataSource.isLoaded();
                this.totalRowCount = dataSource.totalCount();
            }
        }
    }

    onGridOptionChanged(event) {
        if (event.name == 'paging' || ['asc', 'desc'].indexOf(event.value) >= 0)
            this.isDataLoaded = false;
        DataGridService.refreshIfColumnsVisibilityStatusChange(event);
    }

    getODataUrl(uri: string, filter?: Object, instanceData: InstanceModel = null, params: Param[] = null) {
        const searchParam = this.getQuickSearchParam();
        params = (searchParam && [searchParam] || []).concat(params || []);
        return this.oDataService.getODataUrl(uri, filter, instanceData, params);
    }

    processODataFilter(grid, uri, filters: FilterModel[], getCheckCustom, instanceData: InstanceModel = null, params: Param[] = null): Observable<string> {
        this.isDataLoaded = false;
        const searchParam = this.getQuickSearchParam();
        params = searchParam ? params && params.concat([searchParam]) || [searchParam] : params;
        const filteringProcess$ = this.oDataService.processODataFilter(grid, uri, filters, getCheckCustom, this.searchColumns, this.searchValue, instanceData, params);
        filteringProcess$.subscribe((result: string) => {
            if (result === 'canceled') {
                this.isDataLoaded = true;
            }
        })
        return filteringProcess$;
    }

    getSearchFilter(searchColumns: string[] = null, searchValue: string = null) {
        return this.oDataService.getSearchFilter(searchColumns || this.searchColumns, searchValue || this.searchValue);
    }

    getQuickSearchParam() {
        return this.searchValue ? { name: 'quickSearchString', value: this.searchValue } : null;
    }

    activate() {
        this.getRootComponent().overflowHidden(true);
        if (this.searchValue && this.searchClear) {
            this.searchValue = '';
            this.invalidate();
        } if (this.dataGrid && this.dataGrid.instance) {
            let grid = this.dataGrid.instance,
                scroll = grid.getScrollable();
            if (scroll) {
                scroll.update();
                setTimeout(() => {                    
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
            let grid = this.dataGrid.instance,
                scroll = grid.getScrollable();
            if (scroll)
                this._prevScrollPos = scroll.scrollOffset();
            grid.hideColumnChooser();
        }
        this.getRootComponent().overflowHidden();
    }

    ngOnDestroy() {
        this.destroySubject.next(true);
        this.destroySubject.unsubscribe();
    }
}
