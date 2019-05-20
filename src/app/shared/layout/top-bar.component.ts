/** Core imports */
import { Component, Injector } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

/** Third party imports */
import * as _ from 'underscore';

/** Application imports */
import { PanelMenu } from './panel-menu';
import { PanelMenuItem } from './panel-menu-item';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppService } from '@app/app.service';

@Component({
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.less'],
    selector: 'top-bar',
    host: {
        '(window:resize)': 'updateNavMenu()'
    }
})
export class TopBarComponent extends AppComponentBase {
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
        injector: Injector,
        private _appSessionService: AppSessionService,
        private _appService: AppService,
        public router: Router
    ) {
        super(injector);

        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                let currModuleName = (this.config.name || '').toLowerCase();
                if (currModuleName && currModuleName != _appService.getModule())
                    _appService.initModule();

                setTimeout(() => {
                    let route = event.urlAfterRedirects.split('?').shift();
                    this.menu.items.forEach((item, i) => {
                        if (route === item.route || _.contains(item.alterRoutes, route))
                            this.selectedIndex = i;
                    });
                });
            }
        });

        _appService.subscribeModuleChange((config) => {
            this.config = config;
            this.visibleMenuItemsWidth = 0;
            this.menu = new PanelMenu('MainMenu', 'MainMenu',
                this.initMenu(config['navigation'], config['localizationSource'], 0)
            );

            _appService.topMenu = this.menu;
            this.updateNavMenu(true);
        });
    }

    initMenu(config, localizationSource, level): PanelMenuItem[] {
        let navList: PanelMenuItem[] = [];
        config.forEach((val) => {
            let value = val.slice(0);
            if (val.length === 7)
                value.push(this.initMenu(value.pop(), localizationSource, ++level));
            let item = new PanelMenuItem(value[0] && this.localizationService.l('Navigation_' + value[0], localizationSource),
                value[1], value[2], value[3], value[4], value[5], value[6]);
            item.visible = this.showMenuItem(item);
            if (!level && item.visible) {
                item['length'] = (item.text.length * 10 + 32);
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
                let availableWidth = this.lastInnerWidth - 600;
                if (availableWidth < this.visibleMenuItemsWidth) {
                    let switchItemIndex;
                    this.menu.items.every((item, index) => {
                        switchItemIndex = index;
                        if (item.visible)
                            availableWidth -= item['length'];
                        return availableWidth >= 0;
                    });
                    this.navbarItems = switchItemIndex ? this.menu.items.slice(0, --switchItemIndex): [];
                    this.adaptiveMenuItems = switchItemIndex ? this.menu.items.slice(switchItemIndex): this.menu.items;
                } else
                    this.navbarItems = this.menu.items;
            }, 300);
        }
    }

    private checkMenuItemPermission(item): boolean {
        //!!VP Should be considered on module configuration level
        if (this.config['name'] == 'CRM') {
            if (this._appService.isNotHostTenant()) {
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
        return this.checkMenuItemPermission(item);
    }
}
