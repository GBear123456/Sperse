import { Component, Injector, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { LayoutService } from '@app/shared/layout/layout.service';
import { Router } from '@angular/router';
import { AppConsts } from '@shared/AppConsts';

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

    constructor(injector: Injector,
                public _appService: AppService,
                public _layoutService: LayoutService,
                private _router: Router) {
        super(injector);
        
        _appService.getModules().forEach((module) => {
            if (module !== 'CFO') {
                this.modules.push({
                    code: module,
                    name: module
                });
            } else {
                //this.modules.push({
                //    code: module,
                //    name: 'CFO Personal',
                //    uri: 'personal',
                //});
                this.modules.push({
                    code: module,
                    name: 'CFO',
                    uri: 'business',
                });
            }

        });
        _appService.subscribeModuleChange((config) => {
            this.module = config['name'];
            this.uri = _appService.params.instance;
            this.cssClass = this.module.toLowerCase();
            this.hoverModule = this.module;
        });
    }

    changeModule(event) {
        let switchModule = this.modules[event.itemIndex];
        if ((this.module !== switchModule.code || this.uri !== switchModule.uri) &&
            this._appService.isModuleActive(switchModule.code)
        ) {
            this.module = switchModule.code;
            this.uri = switchModule.uri;

            this._appService.switchModule(this.module, { instance: this.uri });
            this._router.navigate(['app/' + this.module.toLowerCase() + (this.uri ? '/' + this.uri.toLowerCase() : '')]);
            this._dropDown.close();
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
