/** Core imports */
import { Component, HostBinding, Inject } from '@angular/core';
import { Router } from '@angular/router';

/** Third party imports */

/** Application imports */
import { AppService } from '@app/app.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { DataLayoutType } from '@app/shared/layout/data-layout-type';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { TitleService } from '@shared/common/title/title.service';
import { AppConsts } from '@shared/AppConsts';
import { DOCUMENT } from '@angular/common';

@Component({
    templateUrl: './platform-select.component.html',
    styleUrls: ['./platform-select.component.less'],
    selector: 'platform-select'
})
export class PlatformSelectComponent {
    @HostBinding('class') public cssClass = '';
    private dropDown: any;
    module = '';
    uri = '';
    modules = {
        topItems: [],
        footerItems: [],
        items: [],
    };
    activeModuleCount = 0;
    permissions = AppPermissions;
    width: string = AppConsts.isMobile ? '100vw' : '760px';

    constructor(
        private appService: AppService,
        private userManagementService: UserManagementService,
        private feature: FeatureCheckerService,
        private permission: PermissionCheckerService,
        private router: Router,
        private titleService: TitleService,
        public layoutService: LayoutService,
        public ls: AppLocalizationService,
        @Inject(DOCUMENT) private document: any
    ) {
        appService.getModules().forEach((module) => {
            if (appService.isModuleActive(module.name) && !module.isMemberPortal) this.activeModuleCount++;
            let config = appService.getModuleConfig(module.name);
            if (module.showInDropdown) {
                let moduleConfig = {
                    code: config ? config.code : module.name,
                    name: module.name,
                    showDescription: module.showDescription,
                    showInDropdown: module.showInDropdown,
                    focusItem: module.focusItem,
                    footerItem: module.footerItem,
                    isComingSoon: module.isComingSoon,
                    uri: module.uri
                };

                if (module.focusItem) {
                    this.modules.topItems.push(moduleConfig);
                } else if (module.footerItem) {
                    if (module.name !== 'CFO' && module.name !== 'PFM' && !this.isDisabled(module.name)) {
                        this.modules.footerItems.push(moduleConfig);
                    } else if (module.name === 'CFO'
                        && this.appService.isModuleActive(module.name)
                        && !appService.isHostTenant
                        && this.feature.isEnabled(AppFeatures.CFOPartner)
                        && this.permission.isGranted(AppPermissions.CFOMemberAccess)
                    ) {
                        this.modules.footerItems.push(moduleConfig);
                    } else if (
                        module.name === 'PFM'
                        && this.appService.isModuleActive(module.name)
                        && (this.feature.isEnabled(AppFeatures.PFMApplications) || this.feature.isEnabled(AppFeatures.PFMCreditReport))
                    ) {
                        this.modules.footerItems = this.modules.footerItems.filter((item) => item.name !== 'CFO');
                        this.modules.footerItems.push(moduleConfig);
                    } else if (
                        module.name === 'BankCode'
                        && !appService.isHostTenant
                        && this.feature.isEnabled(AppFeatures.CRMBANKCode)
                    ) {
                        this.modules.footerItems.push(moduleConfig);
                    }
                } else if (module.showInDropdown) {
                    this.modules.items.push(moduleConfig);
                }
            }
        });
        appService.subscribeModuleChange((config) => {
            this.module = config['name'];
            this.uri = appService.params.instance;
            this.cssClass = this.module.toLowerCase();
            this.titleService.setTitle(config['name']);
        });
    }

    onItemClick(module) {
        if ((this.module !== module.name || this.uri !== module.uri || module.footerItem) &&
            (this.appService.isModuleActive(module.name) || module.name === 'BankCode' || module.name === 'Slice')
        ) {
            let navigate = null;
            let moduleConfig = this.appService.getModuleConfig(module.name);
            if (moduleConfig && moduleConfig.defaultPath) {
                navigate = this.router.navigate([moduleConfig.defaultPath]);
            } else if (module.name === 'Slice' && this.permission.isGranted(AppPermissions.CRMCustomers)) {
                const lastSegment = this.router.url.substring(this.router.url.lastIndexOf('/') + 1);
                const availableSliceLinks: string[] = ['leads', 'clients', 'partners'];
                const group = availableSliceLinks.indexOf(lastSegment) > 0 ? lastSegment : 'leads';
                navigate = this.router.navigate(
                    ['/app/slice/' + group],
                    { queryParams: { dataLayoutType: DataLayoutType.PivotGrid }}
                );
            } else if (module.name === 'PFM' && module.footerItem) {
                return window.open(location.origin + '/personal-finance', '_blank');
            } else if (module.name === 'CFO' && module.footerItem && this.permission.isGranted(AppPermissions.CFOMemberAccess)) {
                return window.open(location.origin + '/app/cfo-portal', '_blank');
            } else if (module.name === 'BankCode' && this.userManagementService.checkBankCodeFeature()) {
                return window.open(location.origin + '/code-breaker/dashboard', '_blank');
            } else {
                navigate = this.router.navigate(['app/' + module.name.toLowerCase() + (module.uri ? '/' + module.uri.toLowerCase() : '')]);
            }
            this.dropDown.option('disabled', true);
            navigate && navigate.then((result) => {
                if (result) {
                    this.module = module.name;
                    this.uri = module.uri;
                    this.appService.switchModule(this.module, { instance: this.uri });
                }
                this.dropDown.option('disabled', false);
            });
            this.dropDown.close();
        }
    }

    isDisabled(item: string): boolean {
        return item !== 'Slice' && !this.appService.isModuleActive(item);
    }

    onDropDownInit(event) {
        this.dropDown = event.component;
        if (AppConsts.isMobile) {
            this.dropDown.option({
                'dropDownOptions.position': {
                    boundary: this.document.body,
                    my: 'top',
                    at: 'bottom',
                    of: this.document.querySelector('app-header')
                }
            });
        }
    }
}
