import { Component, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { PanelMenu } from './panel-menu';
import { PanelMenuItem } from './panel-menu-item';

import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { AppComponentBase } from '@shared/common/app-component-base';

import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppService } from '@app/app.service';

@Component({
  templateUrl: './top-bar.component.html',
	styleUrls: ['./top-bar.component.less'],
  selector: 'top-bar'
})
export class TopBarComponent extends AppComponentBase {
  config: any;
  menu: PanelMenu = <PanelMenu>{
    items: []
  };

  constructor(injector: Injector,
      private _appSessionService: AppSessionService,
      private _appService: AppService,
      public router: Router
  ) {
    super(injector);

    _appService.subscribeModuleChange((config) => {
      this.config = config;
      this.menu = new PanelMenu("MainMenu", "MainMenu", 
        this.initMenu(config['navigation'])
      );
    });
  }

  initMenu(config): PanelMenuItem[] {
    let navList: PanelMenuItem[] = [];
    config.forEach((val) => {
      if (val.length == 5)
        val.push(this.initMenu(val.pop()));          
      navList.push(new PanelMenuItem(val[0], 
        val[1], val[2], val[3], val[4])
      );
    });
    return navList;
  }

	private checkMenuItemPermission(item): boolean {
    return (item.permissionName && this.isGranted(item.permissionName)) ||
			(item.items && item.items.length && this.checkChildMenuItemPermission(item) || !item.permissionName);
	}

  private checkChildMenuItemPermission(menu): boolean {
  	return menu.items.every((item) => {
	  	return this.checkMenuItemPermission(item);
  	});
  }

  showMenuItem(item, index): boolean {
    if (item.permissionName === 'Pages.Administration.Tenant.SubscriptionManagement' && this._appSessionService.tenant && !this._appSessionService.tenant.edition) {
        return false;
    }
    return this.checkMenuItemPermission(item);
  }
}
