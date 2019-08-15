import { Component, Injector, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { AppPermissions } from '@shared/AppPermissions';
import { AppFeatures } from '@shared/AppFeatures';

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
        public _appService: AppService,
        public _layoutService: LayoutService
    ) {
        super(injector);

        _appService.getModules().forEach((module) => {
            if (_appService.isModuleActive(module.name) && !module.isMemberPortal) this.activeModuleCount++;
            let config = _appService.getModuleConfig(module.name);
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
                        && this._appService.isModuleActive(module.name)
                        && !_appService.isHostTenant
                        && this.feature.isEnabled(AppFeatures.CFOPartner)
                        && this.permission.isGranted(AppPermissions.CFOMemberAccess)
                    ) {
                        this.modules.footerItems.push(moduleConfig);
                    } else if (
                        module.name === 'PFM'
                        && this._appService.isModuleActive(module.name)
                        && this.feature.isEnabled(AppFeatures.PFMApplications)
                    ) {
                        this.modules.footerItems = this.modules.footerItems.filter((item) => item.name !== 'CFO');
                        this.modules.footerItems.push(moduleConfig);
                    }
                } else if (module.showInDropdown) {
                    this.modules.items.push(moduleConfig);
                }
            }
        });
        _appService.subscribeModuleChange((config) => {
            this.module = config['name'];
            this.uri = _appService.params.instance;
            this.cssClass = this.module.toLowerCase();
            this.hoverModule = this.module;
            this.setTitle(config['name']);
        });
    }

    onItemClick(module) {
        if ((this.module !== module.name || this.uri !== module.uri || module.footerItem) &&
            this._appService.isModuleActive(module.name)
        ) {
            let navigate = null;
            let moduleConfig = this._appService.getModuleConfig(module.name);
            if (moduleConfig.defaultPath) {
                navigate = this._router.navigate([moduleConfig.defaultPath]);
            } else if (module.name === 'PFM' && module.footerItem) {
                return window.open(location.origin + '/personal-finance', '_blank');
            } else if (module.name === 'CFO' && module.footerItem && this.permission.isGranted(AppPermissions.CFOMemberAccess)) {
                return window.open(location.origin + '/app/cfo-portal', '_blank');
            } else {
                navigate = this._router.navigate(['app/' + module.name.toLowerCase() + (module.uri ? '/' + module.uri.toLowerCase() : '')]);
            }
            this._dropDown.option('disabled', true);
            navigate && navigate.then((result) => {
                if (result) {
                    this.module = module.name;
                    this.uri = module.uri;
                    this._appService.switchModule(this.module, { instance: this.uri });
                }
                this._dropDown.option('disabled', false);
            });
            this._dropDown.close();
        }
    }

    isDisabled(item) {
        return !this._appService.isModuleActive(item);
    }

    onDropDownInit(event) {
        this._dropDown = event.component;
    }
}
