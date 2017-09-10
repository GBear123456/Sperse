import { Injector, Inject, Input } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { LocalizationService } from '@abp/localization/localization.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { NotifyService } from '@abp/notify/notify.service';
import { SettingService } from '@abp/settings/setting.service';
import { MessageService } from '@abp/message/message.service';
import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import { AppSessionService } from '@shared/common/session/app-session.service';

import buildQuery from 'odata-query';
import * as _ from 'underscore';

export abstract class AppComponentBase {
  localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;

	dataSource: any;
	tabIndex: Number = 0;
	filterTabs: String[] = [];
  localization: LocalizationService;
  permission: PermissionCheckerService;
  feature: FeatureCheckerService;
  notify: NotifyService;
  setting: SettingService;
  message: MessageService;
  multiTenancy: AbpMultiTenancyService;
  appSession: AppSessionService;

  constructor(injector: Injector) {
    this.localization = injector.get(LocalizationService);
    this.permission = injector.get(PermissionCheckerService);
    this.feature = injector.get(FeatureCheckerService);
    this.notify = injector.get(NotifyService);
    this.setting = injector.get(SettingService);
    this.message = injector.get(MessageService);
    this.multiTenancy = injector.get(AbpMultiTenancyService);
    this.appSession = injector.get(AppSessionService);
  }

  l(key: string, ...args: any[]): string {
    return this.ls(this.localizationSourceName, key);
  }

  ls(sourcename: string, key: string, ...args: any[]): string {
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
      uri + (filter ? buildQuery({ filter }): '');
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
          .reduce((obj, pair)=>{
            let val = pair.pop(), key = pair.pop(), operator = {};
            if (filter.operator)
              operator[filter.operator] = val;                      
            if (val && (typeof(val) == 'string')) {
              obj[this.capitalize(key)] =  filter.operator ? operator: val;                      
            }
            return obj;
          }, {});
      })
    );
  }

  isGranted(permissionName: string): boolean {
    return this.permission.isGranted(permissionName);
  }
}