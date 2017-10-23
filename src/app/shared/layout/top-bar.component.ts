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
  selector: 'top-bar',
  host: {
    '(window:resize)': "toogleNavMenu()"
  }
})
export class TopBarComponent extends AppComponentBase {
  config: any = {};
  selectedIndex: number;
  visibleMenuItems: number = 0;
  showAdaptiveMenu: boolean = true;
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
      this.showAdaptiveMenu = !this.showAdaptiveMenu;
      this.menu = new PanelMenu("MainMenu", "MainMenu", 
        this.initMenu(config['navigation'])
      );
    });
  }

  initMenu(config): PanelMenuItem[] {
    let navList: PanelMenuItem[] = [];
    config.forEach((val) => {
      let value = val.slice(0);
      if (val.length == 5)
        value.push(this.initMenu(value.pop()));          
      navList.push(new PanelMenuItem(this.l(value[0]), 
        value[1], value[2], value[3], value[4])
      );
    });
    return navList;
  }

  menuItemRendered(event, index){
    if (this.router.url == event.itemData.route)
      setTimeout(() => {
        this.selectedIndex = isNaN(index) ? event.itemIndex: index;
      }, 0);      

    if(event.itemData.visible = this.showMenuItem(event.itemData))
      this.visibleMenuItems++;
    if (event.itemData.items)
      event.itemData.items.forEach((item) => {
        item.visible = this.showMenuItem(item);
      });
  }

  navigate(event, index){   
    if (event.itemData.route) {
      this.router.navigate([event.itemData.route]);
      this.selectedIndex = isNaN(index) ? event.itemIndex: index;
    } 
  }

  toogleNavMenu() {   
    setTimeout(() => {
      let prevValue = this.showAdaptiveMenu;
      this.showAdaptiveMenu = 
        window.innerWidth - 600 < this.visibleMenuItems * 70;
      if (prevValue != this.showAdaptiveMenu)
        this.visibleMenuItems = 0;
    }, 0);
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

  showMenuItem(item): boolean {
    if (item.permissionName === 'Pages.Administration.Tenant.SubscriptionManagement' 
      && this._appSessionService.tenant && !this._appSessionService.tenant.edition
    ) {
        return false;
    }
    return this.checkMenuItemPermission(item);
  }
}
