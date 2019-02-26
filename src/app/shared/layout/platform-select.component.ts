import { Component, Injector, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { LayoutService } from '@app/shared/layout/layout.service';

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
    modules = [];

    private _dropDown: any;

    constructor(
        injector: Injector,
        public _appService: AppService,
        public _layoutService: LayoutService
    ) {
        super(injector);

        _appService.getModules().forEach((module) => {
            let config = _appService.getModuleConfig(module.name);
            let moduleConfig = {
                code: config ? config.code : module.name,
                name: module.name,
                showDescription: module.showDescription
            };
            if (module.name === 'CFO') {
                let cfoPersonalEnable = (!abp.session.tenantId || this.feature.isEnabled('CFO.Partner')) && !this.permission.isGranted('Pages.CFO.MainInstanceAccess');
                moduleConfig['uri'] = cfoPersonalEnable ? 'user' : 'main';
            }
            this.modules.push(moduleConfig);
        });
        _appService.subscribeModuleChange((config) => {
            this.module = config['name'];
            this.uri = _appService.params.instance;
            this.cssClass = this.module.toLowerCase();
            this.hoverModule = this.module;
            this.setTitle(config['name']);
        });
    }

    changeModule(event) {
        let switchModule = this.modules[event.itemIndex];
        if ((this.module !== switchModule.name || this.uri !== switchModule.uri) &&
            this._appService.isModuleActive(switchModule.name) &&
            !this.checkModuleCustomHandler(switchModule)
        ) {
            this.module = switchModule.name;
            this.uri = switchModule.uri;
            let navigate = null;
            let moduleConfig = this._appService.getModuleConfig(switchModule.name);
            if (moduleConfig.defaultPath)
                navigate = this._router.navigate([moduleConfig.defaultPath]);
            else
                navigate = this._router.navigate(['app/' + this.module.toLowerCase() + (this.uri ? '/' + this.uri.toLowerCase() : '')]);
            this._dropDown.option('disabled', true);
            navigate.then(() => {
                this._appService.switchModule(this.module, { instance: this.uri });                
                this._dropDown.option('disabled', false);
            });
            this._dropDown.close();
        }
    }

    checkModuleCustomHandler(module) {
        if (module.name == 'PFM') {
            let moduleConfig = this._appService.getModuleConfig(module.name);
            if (!this.permission.isGranted('Pages.PFM.Applications.ManageOffers'))
                return window.open(location.origin + '/personal-finance', '_blank');
        }        
    }

    isDisabled(item) {
        return !this._appService.isModuleActive(item);
    }

    onHover(module) {
        this.hoverModule = module;
    }

    onDropDownInit(event) {
        this._dropDown = event.component;
    }
}
