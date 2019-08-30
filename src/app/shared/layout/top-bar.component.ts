/** Core imports */
import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

/** Third party imports */
import * as _ from 'underscore';

/** Application imports */
import { PanelMenu } from './panel-menu';
import { PanelMenuItem } from './panel-menu-item';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppService } from '@app/app.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';

@Component({
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.less'],
    selector: 'top-bar',
    host: {
        '(window:resize)': 'updateNavMenu()'
    }
})
export class TopBarComponent {
    config: any = {};
    selectedIndex: number;
    lastInnerWidth: number;
    visibleMenuItemsWidth: 0;
    updateTimeout: any;
    navbarItems: any = [];
    adaptiveMenuItems: any = [];
    menu: PanelMenu = <PanelMenu>{
        items: []
    };

    constructor(
        private appSessionService: AppSessionService,
        private appService: AppService,
        private permissionChecker: AppPermissionService,
        public router: Router,
        public ls: AppLocalizationService
    ) {
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                let currModuleName = (this.config.name || '').toLowerCase();
                if (currModuleName && currModuleName != appService.getModule())
                    appService.initModule();

                setTimeout(() => {
                    let route = event.urlAfterRedirects.split('?').shift();
                    this.menu.items.forEach((item, i) => {
                        if (route === item.route || _.contains(item.alterRoutes, route))
                            this.selectedIndex = i;
                    });
                });
            }
        });

        this.appService.subscribeModuleChange((config) => {
            this.config = config;
            this.visibleMenuItemsWidth = 0;
            this.menu = new PanelMenu('MainMenu', 'MainMenu',
                this.initMenu(config['navigation'], config['localizationSource'], 0)
            );

            this.appService.topMenu = this.menu;
            this.updateNavMenu(true);
        });
    }

    initMenu(config, localizationSource, level): PanelMenuItem[] {
        let navList: PanelMenuItem[] = [];
        config.forEach((val) => {
            let value = val.slice(0);
            if (val.length === 7)
                value.push(this.initMenu(value.pop(), localizationSource, ++level));
            let item = new PanelMenuItem(value[0] && this.ls.l('Navigation_' + value[0], localizationSource),
                value[1], value[2], value[3], value[4], value[5], value[6], value[7]);
            item.visible = this.showMenuItem(item);
            if (!level && item.visible) {
                item['length'] = item.text.length * 10 + 38;
                this.visibleMenuItemsWidth += item['length'];
            }
            navList.push(item);
        });
        return navList;
    }

    navigate(event) {
        let route = event.itemData.route;
        if (route) {
            if (route.startsWith('/'))
                this.router.navigate([event.itemData.route]);
            else
                window.open(route, '_blank');
        }
    }

    updateNavMenu(forced = false) {
        if (forced || (window.innerWidth != this.lastInnerWidth)) {
            this.navbarItems = [];
            this.adaptiveMenuItems = [];
            clearTimeout(this.updateTimeout);
            this.updateTimeout = setTimeout(() => {
                this.lastInnerWidth = window.innerWidth;
                let availableWidth = this.lastInnerWidth - 685;
                if (availableWidth < this.visibleMenuItemsWidth) {
                    let switchItemIndex;
                    this.menu.items.every((item, index) => {
                        switchItemIndex = index;
                        if (item.visible)
                            availableWidth -= item['length'];
                        return availableWidth >= 0;
                    });
                    this.navbarItems = switchItemIndex ? this.menu.items.slice(0, --switchItemIndex) : [];
                    this.adaptiveMenuItems = switchItemIndex ? this.menu.items.slice(switchItemIndex) : this.menu.items;
                } else
                    this.navbarItems = this.menu.items;
            }, 300);
        }
    }

    private checkMenuItemPermission(item: PanelMenuItem): boolean {
        //!!VP Should be considered on module configuration level
        if (this.config['name'] == 'CRM') {
            if (!this.appService.isHostTenant) {
                if (['Editions'].indexOf(item.text) >= 0)
                    return false;
            } else if (['Products'].indexOf(item.text) >= 0)
                return false;
        }

        return this.appService.isFeatureEnable(item.featureName) && (this.permissionChecker.isGranted(item.permissionName) ||
            (item.items && item.items.length && this.checkChildMenuItemPermission(item) || !item.permissionName));
    }

    private checkChildMenuItemPermission(menu): boolean {
        return menu.items.every((item) => {
            return this.checkMenuItemPermission(item);
        });
    }

    showMenuItem(item: PanelMenuItem): boolean {
        return (!item.host || (abp.session.multiTenancySide == <any>abp.multiTenancy.sides[item.host.toUpperCase()])) && this.checkMenuItemPermission(item);
    }
}
