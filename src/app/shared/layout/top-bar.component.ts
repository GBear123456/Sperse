import {Component, Injector} from '@angular/core';
import {Router, NavigationEnd} from '@angular/router';
import {PanelMenu} from './panel-menu';
import {PanelMenuItem} from './panel-menu-item';

import {PermissionCheckerService} from '@abp/auth/permission-checker.service';
import {AppComponentBase} from '@shared/common/app-component-base';

import {AppSessionService} from '@shared/common/session/app-session.service';
import { AppService } from '@app/app.service';
import * as _ from 'underscore';

@Component({
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.less'],
    selector: 'top-bar',
    host: {
        '(window:resize)': 'toogleNavMenu()'
    }
})
export class TopBarComponent extends AppComponentBase {
    config: any = {};
    selectedIndex: number;
    visibleMenuItemsWidth: 0;
    showAdaptiveMenu: boolean;
    menu: PanelMenu = <PanelMenu>{
        items: []
    };

    constructor(injector: Injector,
                private _appSessionService: AppSessionService,
                private _appService: AppService,
                public router: Router) {
        super(injector);

        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                setTimeout(() => {
                    this.menu.items.forEach((item, i) => {
                        let route = this.router.url.split('?')[0];
                        if (route === item.route || _.contains(item.alterRoutes, route))
                            this.selectedIndex = i;
                    });
                    this.toogleNavMenu();
                }, 300);
            }
        });

        _appService.subscribeModuleChange((config) => {
            this.config = config;
            this.visibleMenuItemsWidth = 0;
            this.showAdaptiveMenu = undefined;
            this.menu = new PanelMenu('MainMenu', 'MainMenu',
                this.initMenu(config['navigation'], 0)
            );

            _appService.topMenu = this.menu;
        });
    }

    initMenu(config, level): PanelMenuItem[] {
        let navList: PanelMenuItem[] = [];
        config.forEach((val) => {
            let value = val.slice(0);
            if (val.length === 7)
                value.push(this.initMenu(value.pop(), ++level));
            let item = new PanelMenuItem(this.l(value[0]),
                value[1], value[2], value[3], value[4], value[5], value[6]);
            item.visible = this.showMenuItem(item);
            if (!level && item.visible)
                this.visibleMenuItemsWidth += (item.text.length * 10 + 32);
            navList.push(item);
        });
        return navList;
    }

    navigate(event) {
        if (event.itemData.route)
            this.router.navigate([event.itemData.route]);
    }

    toogleNavMenu() {
        this.showAdaptiveMenu = window.innerWidth - 550 < this.visibleMenuItemsWidth;
    }

    private checkMenuItemPermission(item): boolean {
        //!!VP Should be considered on module configuration level
        if (this.config['name'] == 'CRM') {
            if (abp.session.multiTenancySide == abp.multiTenancy.sides.TENANT) {
                if (['Editions'].indexOf(item.text) >= 0)
                    return false;
            } else if (['Products'].indexOf(item.text) >= 0)
                return false;
        }

        return this.isFeatureEnable(item.featureName) && ((item.permissionName && this.isGranted(item.permissionName)) ||
            (item.items && item.items.length && this.checkChildMenuItemPermission(item) || !item.permissionName));
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
