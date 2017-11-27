import { Injector, Inject, Input, ApplicationRef, ElementRef, HostBinding } from '@angular/core';
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

import buildQuery from 'odata-query';
import * as _ from 'underscore';

export abstract class AppComponentBase {
  	@HostBinding('class') public cssClass = '';

    dataGrid: any;
    dataSource: any;
    localization: LocalizationService;
    permission: PermissionCheckerService;
    feature: FeatureCheckerService;
    notify: NotifyService;
    setting: SettingService;
    message: MessageService;
    multiTenancy: AbpMultiTenancyService;
    appSession: AppSessionService;

    private _elementRef: ElementRef;
    private _applicationRef: ApplicationRef;
    public _exportService: ExportService;

    constructor(private _injector: Injector,
        public localizationSourceName = AppConsts.localization.defaultLocalizationSourceName) {
        this.localization = _injector.get(LocalizationService);
        this.permission = _injector.get(PermissionCheckerService);
        this.feature = _injector.get(FeatureCheckerService);
        this.notify = _injector.get(NotifyService);
        this.setting = _injector.get(SettingService);
        this.message = _injector.get(MessageService);
        this.multiTenancy = _injector.get(AbpMultiTenancyService);
        this.appSession = _injector.get(AppSessionService);
        this._applicationRef = _injector.get(ApplicationRef);
        this._exportService = _injector.get(ExportService);
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

    capitalize = require('underscore.string/capitalize');

    getODataURL(uri: String, filter?: Object) {
        return AppConsts.remoteServiceBaseUrl + '/odata/' +
            uri + (filter ? buildQuery({ filter }) : '');
    }

    getODataVersion() {
        return 4;
    }

    advancedODataFilter(grid: any, uri: string, query: any[]) {
        grid.getDataSource()['_store']['_url'] =
            this.getODataURL(uri, query);

        grid.refresh();
    }

    processODataFilter(grid, uri, filters, getCheckCustom) {
        this.advancedODataFilter(grid, uri,
            filters.map((filter) => {
                return getCheckCustom(filter) || _.pairs(filter.items)
                    .reduce((obj, pair) => {
                        let val = pair.pop().value, key = pair.pop(), operator = {};
                        if (filter.operator)
                            operator[filter.operator] = val;
                        if (val && (typeof (val) == 'string')) {
                            obj[this.capitalize(key)] = filter.operator ? operator : val;
                        }
                        return obj;
                    }, {});
            })
        );
    }

    isGranted(permissionName: string): boolean {
        return this.permission.isGranted(permissionName);
    }

    exportToXLS(option) {
        this.dataGrid.export.fileName =
            this._exportService.getFileName();
        this.dataGrid.instance
          .exportToExcel(option == 'selected');
    }

    exportToCSV() {
        this._exportService.saveAsCSV(
            this.dataGrid.instance.getDataSource().items()
        );
    }

    exportToGoogleSheet(option) {
        this._exportService.exportToGoogleSheets(
            this.dataGrid, option == 'all');
    }

    openFullscreen(element?: any) {    
        element = element || this.getElementRef().nativeElement;
        let method = element.requestFullScreen || element.webkitRequestFullScreen 
            || element.mozRequestFullScreen || element.msRequestFullScreen;
        if (method) {
            method.call(element);
            this.cssClass = 'fullscreen';
        }
    }

    exitFullscreen() {
        let method = (document.exitFullscreen || document.webkitExitFullscreen 
            || document['mozCancelFullScreen'] || document['msExitFullscreen']);
        if (method) {
            method.call(document);
            this.cssClass = '';
        }
    }

    isFullscreenMode() {
        return document['fullScreen'] || document['mozFullScreen'] 
            || document.webkitIsFullScreen;
    }

    toggleFullscreen(element?: any) {
        if (this.isFullscreenMode())
            this.exitFullscreen();
        else
            this.openFullscreen(element);
    }

    getPhoto(photo, gender): string {
        if (photo)
            return 'data:image/jpeg;base64,' + photo;
        if (gender)
            return 'assets/common/images/no-photo-' + gender + '.png';

        return 'assets/common/images/no-photo.png';
    }
}
