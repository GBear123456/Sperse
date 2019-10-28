/** Core imports */
import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

/** Third party imports */
import { DxNavBarComponent } from 'devextreme-angular/ui/nav-bar';
import * as _ from 'underscore';
import { filter, takeUntil } from 'rxjs/operators';

/** Application imports */
import { PanelMenu } from './panel-menu';
import { PanelMenuItem } from './panel-menu-item';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppService } from '@app/app.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.less'],
    selector: 'top-bar',
    host: {
        '(window:resize)': 'updateNavMenu()'
    },
    providers: [ LifecycleSubjectsService ]
})
export class TopBarComponent implements OnDestroy {
    @ViewChild(DxNavBarComponent) navBar: DxNavBarComponent;

    config: any = {};
    selectedIndex: number;
    lastInnerWidth: number;
    updateTimeout: any;
    navbarItems: any = [];
    adaptiveMenuItems: any = [];
    mutationObservers: any = {};
    menu: PanelMenu = <PanelMenu>{
        items: []
    };

    constructor(
        private appSessionService: AppSessionService,
        private appService: AppService,
        private permissionChecker: AppPermissionService,
        private lifecycleService: LifecycleSubjectsService,
        private router: Router,
        private route: ActivatedRoute,
        public ls: AppLocalizationService,
        @Inject(DOCUMENT) private document: any
    ) {
        window['t'] = this;
        this.router.events
            .pipe(
                takeUntil(this.lifecycleService.destroy$),
                filter(event => event instanceof NavigationEnd)
            ).subscribe((event: any) => {
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
            });
        this.appService.subscribeModuleChange((config) => {
            this.config = config;
            this.menu = new PanelMenu('MainMenu', 'MainMenu',
                this.initMenu(config['navigation'], config['localizationSource'], 0)
            );
            const selectedIndex = this.navbarItems.findIndex((navBarItem) => {
                return navBarItem.route === this.router.url;
            });
            this.navbarItems = this.menu.items;
            this.selectedIndex = selectedIndex === -1 ? this.selectedIndex : selectedIndex;
            if (this.navBar && this.navBar.instance) {
                this.navBar.instance.option({
                    'items': this.navbarItems,
                    'selectedIndex': this.selectedIndex,
                    'selectedItems': [this.navbarItems[this.selectedIndex]]
                });
            }
            this.appService.topMenu = this.menu;
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
            clearTimeout(this.updateTimeout);
            this.updateTimeout = setTimeout(() => {
                forced && this.calculateItemsWidth();
                this.lastInnerWidth = window.innerWidth;
                if (this.lastInnerWidth < 768) {
                    this.navbarItems = [];
                    this.adaptiveMenuItems = this.menu.items;
                } else {
                    let switchItemIndex,
                        availableWidth = this.getAvailableWidth();

                    if (this.menu.items.every((item, index) => {
                        switchItemIndex = index;
                        if (item.visible)
                            availableWidth -= item['width'];
                        return availableWidth >= 0;
                    })) {
                        this.navbarItems = this.menu.items;
                        this.adaptiveMenuItems = [];
                    } else {
                        this.navbarItems = switchItemIndex ? this.menu.items.slice(0, switchItemIndex) : [];
                        this.adaptiveMenuItems = switchItemIndex ? this.menu.items.slice(switchItemIndex) : this.menu.items;
                    }
                }
            }, 300);
        }
    }

    contentChangeObserve() {
        [
            'user-management-list', 'contact-info-panel',
            'platform-select', '.page-header-inner .page-logo'
        ].forEach((sel) => {
            let element = this.document.body.querySelector(sel);
            if (element && !this.mutationObservers[sel]) {
                this.mutationObservers[sel] = new MutationObserver(() => {
                    this.updateNavMenu(true);
                });
                this.mutationObservers[sel].observe(element, {
                    attributes: true,
                    childList: true,
                    subtree: true
                });
            }
        });
    }

    getNavBarElement() {
        return this.navBar.instance.element() as any;
    }

    calculateItemsWidth() {
        let items = this.getNavBarElement().querySelectorAll('div.dx-tab.dx-nav-item');
        Array.prototype.forEach.call(items, (elm, index) => {
            this.menu.items[index]['width'] = elm.offsetWidth + 20;
        });
    }

    getAvailableWidth() {
        return this.getNavBarElement().offsetWidth;
    }

    onNavBarInitialized() {
        this.contentChangeObserve();
        this.updateNavMenu(true);
    }

    private checkMenuItemPermission(item: PanelMenuItem): boolean {
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

    change(e) {
        console.log(e);
    }

    ngOnDestroy() {
        this.lifecycleService.destroy.next(null);
    }
}
