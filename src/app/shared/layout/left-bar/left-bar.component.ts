/** Core imports */
import {
  Component,
  Inject,
  HostListener,
  HostBinding,
  OnDestroy,
  AfterViewInit,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

/** Third party imports */
import { DxMenuComponent } from 'devextreme-angular/ui/menu';
import { DxNavBarComponent } from 'devextreme-angular/ui/nav-bar';
import * as _ from 'underscore';
import isEqual from 'lodash/isEqual';
import { Observable } from 'rxjs';
import { filter, takeUntil, map } from 'rxjs/operators';

/** Application imports */
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppFeatures } from '@shared/AppFeatures';
import { PanelMenu } from '../top-bar/panel-menu';
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { PanelMenuItem } from '../top-bar/panel-menu-item';
import { LayoutService } from '@app/shared/layout/layout.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LayoutType, CommonUserInfoServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { UserDropdownMenuItemModel } from '@shared/common/layout/user-management-list/user-dropdown-menu/user-dropdown-menu-item.model';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { ConfigInterface } from '@app/shared/common/config.interface';
import { ConfigNavigation } from '@app/shared/common/config-navigation.interface';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { ImpersonationService } from '@app/admin/users/impersonation.service';
import { environment } from '@root/environments/environment';
import { AppPermissions } from '@shared/AppPermissions';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { ChatSignalrService } from '../chat/chat-signalr.service';
import { QuickSideBarChat } from 'app/shared/layout/chat/QuickSideBarChat';
import { PlatformSelectComponent } from '../platform-select/platform-select.component';
import { ThemeService } from '@app/shared/services/theme.service';

@Component({
  templateUrl: './left-bar.component.html',
  styleUrls: ['./left-bar.component.less'],
  selector: 'left-bar',
  providers: [LifecycleSubjectsService, CommonUserInfoServiceProxy],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeftBarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(PlatformSelectComponent) platformSelector: PlatformSelectComponent;
  @HostBinding('style.width') width: string = '90px';

  isSubMenuOpen = false;
  userCompany$: Observable<string>;
  dropdownMenuItems: UserDropdownMenuItemModel[] = this.userManagementService.defaultDropDownItems;
  remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
  config: ConfigInterface;
  selectedModuleIndex: number;
  moduleItems = ['CRM', 'CFO', 'API', 'Admin']
    .map(name => {
      return { title: name, disabled: false, items: [], selectedItem: undefined };
    })
    .filter(item => this.isModuleVisible(item.title));
  panelMenuList: PanelMenu[] = [];
  isChatConnected = this.chatSignalrService.isChatConnected;
  isChatEnabled = this.feature.isEnabled(AppFeatures.AppChatFeature);
  unreadChatMessageCount = 0;
  expanded = false;
  isDarkTheme$ = this.themeService.isDarkTheme$;
  isDarkTheme: boolean = false;
  totalWrapperMaxHeight = 'auto';

  constructor(
    private feature: FeatureCheckerService,
    private authService: AppAuthService,
    public appSessionService: AppSessionService,
    public appService: AppService,
    private changeDetectorRef: ChangeDetectorRef,
    private impersonationService: ImpersonationService,
    private permissionChecker: AppPermissionService,
    private lifecycleService: LifecycleSubjectsService,
    private commonUserInfoService: CommonUserInfoServiceProxy,
    public userManagementService: UserManagementService,
    public layoutService: LayoutService,
    public quickSideBarChat: QuickSideBarChat,
    private chatSignalrService: ChatSignalrService,
    private router: Router,
    private themeService: ThemeService,
    private route: ActivatedRoute,
    public ls: AppLocalizationService,
    @Inject(DOCUMENT) private document: any
  ) {
    this.appService.subscribeModuleChange((config: ConfigInterface) => {
      this.config = config;

      if (isNaN(this.selectedModuleIndex)) this.initModuleItems();

      this.moduleItems.forEach((module, index) => {
        if (
          config.name.toLowerCase() == module.title.toLowerCase() &&
          this.selectedModuleIndex != index
        )
          this.selectedModuleIndex = index;
      });

      if (Number.isInteger(this.selectedModuleIndex))
        this.appService.topMenu = this.panelMenuList[this.selectedModuleIndex];

      this.updateSelectedItem();
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    const windowHeight = window.innerHeight;
    this.totalWrapperMaxHeight = windowHeight < 900 ? `${windowHeight - 150}px` : '807px';
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {
    this.layoutService.expandedLeftBarSubject
      .asObservable()
      .pipe(takeUntil(this.lifecycleService.destroy$))
      .subscribe(val => {
        if ((this.expanded = val)) {
          this.width = '260px';
        } else {
          if (!this.isSubMenuOpen) {
            this.width = '90px';
          }
        }

        this.changeDetectorRef.detectChanges();
      });

    this.userCompany$ = this.commonUserInfoService
      .getCompany()
      .pipe(map(x => (isEqual(x, {}) ? null : x)));
    this.registerToEvents();

    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.lifecycleService.destroy$))
      .subscribe(val => {
        this.isDarkTheme = val;
        this.changeDetectorRef.markForCheck();
      });

    this.onResize(null as any);
  }

  ngAfterViewInit() {
    this.appService.initModule();
    this.updateSelectedItem();
  }

  isModuleVisible(item: string): boolean {
    return this.appService.isModuleActive(item);
  }

  initModuleItems() {
    this.moduleItems.forEach((module, index) => {
      let config = this.appService.getModuleConfig(module.title);

      if (module.title == 'CFO') {
        this.appService.initModuleNavigationParams(config, {
          instance: this.getModuleUri(module.title),
        });
      }

      this.panelMenuList[index] = new PanelMenu(
        'MainMenu',
        'MainMenu',
        this.initMenu(
          this.getCheckLayoutMenuConfig(config.navigation, config.code),
          config.localizationSource
        )
      );

      module.items = this.panelMenuList[index].items || [];
      module.selectedItem = module.items[0];
    });
    this.changeDetectorRef.detectChanges();
  }

  // Alternative method if you want to handle navigation manually:
  onHomeClick(event: Event) {
    event.preventDefault();
    this.updateSelectedItem();
    this.router.navigate([
      '/app/crm',
      this.appService.isHostTenant ? 'start' : this.layoutService.getWelcomePageUri(),
    ]);
  }

  updateSelectedItem() {
    // Navigate to /app/crm/start
    let module = this.moduleItems[this.selectedModuleIndex];
    if (module && module.items.length) {
      let route = this.router.url.split('?').shift();
      module.items.some((item: PanelMenuItem, i: number) => {
        if (route.includes(item.route) || _.contains(item.alterRoutes, route))
          return (module.selectedItem = item);
      });
    }
    this.changeDetectorRef.detectChanges();
  }

  registerToEvents() {
    if (this.isChatEnabled && this.layoutService.showChatButton) {
      abp.event.on('app.chat.unreadMessageCountChanged', messageCount => {
        this.unreadChatMessageCount = messageCount;
      });
      if (!this.isChatConnected)
        abp.event.on('app.chat.connected', () => {
          this.isChatConnected = true;
        });
    }
  }

  initMenu(configNavigation: ConfigNavigation[], localizationSource): PanelMenuItem[] {
    let navList: PanelMenuItem[] = [];
    configNavigation.forEach((navigation: ConfigNavigation) => {
      let item = new PanelMenuItem(
        navigation.title ||
          (navigation.text &&
            this.ls.ls(
              localizationSource,
              (navigation.localization || 'Navigation_') + navigation.text
            )),
        navigation.permission,
        navigation.icon,
        navigation.route,
        navigation.feature,
        navigation.route === '/app/crm/reports'
          ? !this.appSessionService.tenant ||
            this.appSessionService.tenant.customLayoutType !== LayoutType.BankCode
          : !navigation.route,
        navigation.alterRoutes,
        navigation.host,
        navigation.layout,
        navigation.items ? this.initMenu(navigation.items, localizationSource) : undefined,
        navigation.params
      );
      item.visible = this.showMenuItem(item);
      navList.push(item);
    });
    return navList;
  }

  getCheckLayoutMenuConfig(
    configNavigation: ConfigNavigation[],
    configCode: string
  ): ConfigNavigation[] {
    const MENU_HOME = 'Home';
    let tenant = this.appSessionService.tenant;

    if (
      tenant &&
      tenant.customLayoutType == LayoutType.BankCode &&
      configNavigation[0].text != MENU_HOME &&
      (configCode === 'CRM' || configCode === 'Slice')
    ) {
      configNavigation.unshift({
        text: MENU_HOME,
        icon: 'assets/common/icons/crm/portal.png',
        route: '/code-breaker',
      });
    }
    return configNavigation;
  }

  navigate(event) {
    let route = event.itemData.route;
    /** Avoid redirect to the same route */
    if (
      route &&
      (location.pathname !== event.itemData.route ||
        location.search != UrlHelper.getUrl('', event.itemData.params))
    ) {
      if (route.startsWith('/')) {
        if (
          ['/code-breaker', '/personal-finance'].includes(event.itemData.route) &&
          AppConsts.appMemberPortalUrl
        ) {
          if (this.authService.checkCurrentTopDomainByUri())
            this.authService.setTokenBeforeRedirect();
          else {
            return this.impersonationService.impersonate(
              abp.session.userId,
              abp.session.tenantId,
              AppConsts.appMemberPortalUrl
            );
          }
          location.href = AppConsts.appMemberPortalUrl;
        } else
          this.router
            .navigate(
              [event.itemData.route],
              event.itemData.params ? { queryParams: event.itemData.params } : undefined
            )
            .then(() => this.updateSelectedItem());
      } else window.open(route, '_blank');
    }
  }

  private checkMenuItemPermission(item: PanelMenuItem): boolean {
    if (
      environment.releaseStage != 'staging' &&
      item.permission == AppPermissions.AdministrationHostDashboard
    )
      return false;

    return (
      this.appService.isFeatureEnable(item.feature) &&
      (this.permissionChecker.isGranted(item.permission) ||
        (item.items && item.items.length && this.checkChildMenuItemPermission(item)) ||
        !item.permission)
    );
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
    return (
      (!item.host ||
        abp.session.multiTenancySide == <any>abp.multiTenancy.sides[item.host.toUpperCase()]) &&
      this.checkMenuItemPermission(item) &&
      this.checkMenuItemLayout(item)
    );
  }

  ngOnDestroy() {
    this.lifecycleService.destroy.next(null);
  }

  logoClick() {
    location.href = origin;
  }

  showPlatformSelect() {
    this.platformSelector.dropDownBox.instance.open();
  }

  onSubmenuShowing($event) {
    this.isSubMenuOpen = true;
  }

  onSubmenuHiding($event) {
    this.isSubMenuOpen = false;
    if (!this.expanded && !$event.cancel) {
      this.width = '90px';
    }
  }

  onItemTitleClick(event) {
    if (event.itemData.title == 'Home') {
      this.router.navigate(['app/crm/' + this.layoutService.getWelcomePageUri()]);
      event.event.preventDefault();
      event.event.stopPropagation();
    } else {
      let module = event.itemData.title;
      this.router.navigate(['app/' + module.toLowerCase()]).then(() => {
        this.appService.switchModule(module, { instance: this.getModuleUri(module) });
        this.updateSelectedItem();
      });
    }
  }

  getModuleUri(name: string) {
    return this.appService
      .getModules()
      .find(module => module.name.toLowerCase() == name.toLowerCase()).uri;
  }

  getTargetByTitle(val: string) {
    return val ? val.replace(/\W/gim, '') : '';
  }

  getAccordeonHeight(items) {
    return innerHeight - 420 < items.length * 25 ? innerHeight - 420 : '100%';
  }

  popupVisible = false;

  openPopup() {
    this.popupVisible = true;
  }
}
