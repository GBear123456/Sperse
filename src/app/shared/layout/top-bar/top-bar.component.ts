/** Core imports */
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

/** Third party imports */
import { DxNavBarComponent } from 'devextreme-angular/ui/nav-bar';
import * as _ from 'underscore';
import { filter, takeUntil } from 'rxjs/operators';

/** Application imports */
import { PanelMenu } from './panel-menu';
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { PanelMenuItem } from './panel-menu-item';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { ConfigNavigation } from '@app/shared/common/config-navigation.interface';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { ImpersonationService } from '@app/admin/users/impersonation.service';

@Component({
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.less'],
    selector: 'top-bar',
    host: {
        '(window:resize)': 'updateNavMenu()'
    },
    providers: [ LifecycleSubjectsService ]
})
export class TopBarComponent implements OnInit, OnDestroy {
    @ViewChild(DxNavBarComponent, { static: false }) navBar: DxNavBarComponent;

    config: ConfigInterface;
    selectedIndex: number;
    lastInnerWidth: number;
    updateTimeout: any;
    navbarItems: PanelMenuItem[] = [];
    adaptiveMenuItems: any = [];
    mutationObservers: any = {};
    menu: PanelMenu = <PanelMenu>{
        items: []
    };

    constructor(
        private authService: AppAuthService,
        private appSessionService: AppSessionService,
        private appService: AppService,
        private impersonationService: ImpersonationService,
        private permissionChecker: AppPermissionService,
        private lifecycleService: LifecycleSubjectsService,
        private router: Router,
        private route: ActivatedRoute,
        public ls: AppLocalizationService,
        @Inject(DOCUMENT) private document: any
    ) {
        this.router.events.pipe(
            takeUntil(this.lifecycleService.destroy$),
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            let currModuleName = (this.config ? this.config.name : '').toLowerCase();
            if (currModuleName && currModuleName != appService.getModule())
                appService.initModule();
            setTimeout(() => {
                let route = event.urlAfterRedirects.split('?').shift();
                this.menu.items.forEach((item: PanelMenuItem, i: number) => {
                    if (route === item.route || _.contains(item.alterRoutes, route))
                        this.selectedIndex = i;
                });
            });
        });
        this.appService.subscribeModuleChange((config: ConfigInterface) => {
            this.config = config;
            this.menu = new PanelMenu(
                'MainMenu',
                'MainMenu',
                this.initMenu(
                    this.getCheckLayoutMenuConfig(config.navigation, config.code),
                    config.localizationSource
                )
            );
            const selectedIndex = this.navbarItems.findIndex((navBarItem: PanelMenuItem) => {
                return navBarItem.route === this.router.url.split('?')[0];
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

    ngOnInit(): void {
        this.appService.showContactInfoPanel$.pipe(
            takeUntil(this.lifecycleService.destroy$),
            filter(Boolean)
        ).subscribe(() => {
            this.updateNavMenu(true);
        });
    }

    get showGlobalSearch():  boolean {
        return this.config && this.config.name === 'CRM';
    };

    initMenu(configNavigation: ConfigNavigation[], localizationSource): PanelMenuItem[] {
        let navList: PanelMenuItem[] = [];
        configNavigation.forEach((navigation: ConfigNavigation) => {
            let item = new PanelMenuItem(
                navigation.text && this.ls.ls(localizationSource, 'Navigation_' + navigation.text),
                navigation.permission,
                navigation.icon,
                navigation.route,
                navigation.feature,
                navigation.route === '/app/crm/reports'
                    ? (!this.appSessionService.tenant || this.appSessionService.tenant.customLayoutType !== LayoutType.BankCode)
                    : !navigation.route,
                navigation.alterRoutes,
                navigation.host
            );
            item.visible = this.showMenuItem(item);
            navList.push(item);
        });
        return navList;
    }

    getCheckLayoutMenuConfig(configNavigation: ConfigNavigation[], configCode: string): ConfigNavigation[] {
        const MENU_HOME = 'Home';
        let tenant = this.appSessionService.tenant;

        if (tenant && tenant.customLayoutType == LayoutType.BankCode && configNavigation[0].text != MENU_HOME
            && (configCode === 'CRM' || configCode === 'Slice')) {
            configNavigation.unshift({
                text: MENU_HOME,
                route: '/code-breaker'
            });
        }
        return configNavigation;
    }

    navigate(event) {
        let route = event.itemData.route;
        /** Avoid redirect to the same route */
        if (route && location.pathname !== event.itemData.route) {
            if (route.startsWith('/')) {
                if (event.itemData.route == '/code-breaker' && AppConsts.appMemberPortalUrl) {
                    if (this.authService.checkCurrentTopDomainByUri())
                        this.authService.setTokenBeforeRedirect();
                    else {
                        return this.impersonationService.impersonate(
                            abp.session.userId, abp.session.tenantId, AppConsts.appMemberPortalUrl
                        );
                    }
                    location.href = AppConsts.appMemberPortalUrl;
                } else
                    this.router.navigate([event.itemData.route]);
            } else
                window.open(route, '_blank');
        }
    }

    updateNavMenu(forced: boolean = false) {
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

                    if (this.menu.items.every((item: PanelMenuItem, index: number) => {
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
                this.navBar.instance.option('selectedIndex', this.selectedIndex);
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
            this.menu.items[index].width = elm.offsetWidth + 20;
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
        return this.appService.isFeatureEnable(item.feature) && (this.permissionChecker.isGranted(item.permission) ||
            (item.items && item.items.length && this.checkChildMenuItemPermission(item) || !item.permission));
    }

    private checkChildMenuItemPermission(menu: PanelMenuItem): boolean {
        return menu.items.every((item: PanelMenuItem) => {
            return this.checkMenuItemPermission(item);
        });
    }

    private checkMenuItemLayout(menu: PanelMenuItem): boolean {
        return !menu.layoutType;
    }

    showMenuItem(item: PanelMenuItem): boolean {
        return (!item.host || (abp.session.multiTenancySide == <any>abp.multiTenancy.sides[item.host.toUpperCase()])) && this.checkMenuItemPermission(item) && this.checkMenuItemLayout(item);
    }

    ngOnDestroy() {
        this.lifecycleService.destroy.next(null);
    }
}
