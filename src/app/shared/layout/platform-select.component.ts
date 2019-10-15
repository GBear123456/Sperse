import { Component, Injector, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';

@Component({
    templateUrl: './platform-select.component.html',
    styleUrls: ['./platform-select.component.less'],
    selector: 'platform-select'
})
export class PlatformSelectComponent extends AppComponentBase {
    @HostBinding('class') public cssClass = '';
    hoverModule = '';
    module = '';
    uri = '';
    modules = {
        topItems: [],
        footerItems: [],
        items: [],
    };
    activeModuleCount = 0;
    permissions = AppPermissions;
    private _dropDown: any;

    constructor(
        injector: Injector,
        private appService: AppService,
        private userManagementService: UserManagementService,
        public layoutService: LayoutService
    ) {
        super(injector);

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
            this.hoverModule = this.module;
            this.setTitle(config['name']);
        });
    }

    onItemClick(module) {
        if ((this.module !== module.name || this.uri !== module.uri || module.footerItem) &&
            (this.appService.isModuleActive(module.name) || module.name === 'BankCode')
        ) {
            let navigate = null;
            let moduleConfig = this.appService.getModuleConfig(module.name);
            if (moduleConfig && moduleConfig.defaultPath) {
                navigate = this._router.navigate([moduleConfig.defaultPath]);
            } else if (module.name === 'PFM' && module.footerItem) {
                return window.open(location.origin + '/personal-finance', '_blank');
            } else if (module.name === 'CFO' && module.footerItem && this.permission.isGranted(AppPermissions.CFOMemberAccess)) {
                return window.open(location.origin + '/app/cfo-portal', '_blank');
            } else if (module.name === 'BankCode' && this.userManagementService.checkBankCodeFeature()) {
                return window.open(location.origin + '/code-breaker/dashboard', '_blank');
            } else {
                navigate = this._router.navigate(['app/' + module.name.toLowerCase() + (module.uri ? '/' + module.uri.toLowerCase() : '')]);
            }
            this._dropDown.option('disabled', true);
            navigate && navigate.then((result) => {
                if (result) {
                    this.module = module.name;
                    this.uri = module.uri;
                    this.appService.switchModule(this.module, { instance: this.uri });
                }
                this._dropDown.option('disabled', false);
            });
            this._dropDown.close();
        }
    }

    isDisabled(item) {
        return !this.appService.isModuleActive(item);
    }

    onDropDownInit(event) {
        this._dropDown = event.component;
    }
}
