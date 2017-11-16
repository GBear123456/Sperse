import { Component, Injector, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { Router } from '@angular/router';
import { AppConsts } from '@shared/AppConsts';

@Component({
    templateUrl: './platform-select.component.html',
    styleUrls: ['./platform-select.component.less'],
    selector: 'platform-select'
})
export class PlatformSelectComponent extends AppComponentBase {
    @HostBinding('class') private cssClass = '';

    hoverModule = '';
    module = '';
    modules = [];

    private _dropDown: any;

    constructor(injector: Injector,
                private _appService: AppService,
                private _router: Router) {
        super(injector);

        this.modules = _appService.getModules();
        _appService.subscribeModuleChange((config) => {
            this.cssClass = (this.module = config['name']).toLowerCase();
            this.hoverModule = this.module;
        });
    }

    changeModule(event) {
        let switchModule = this.modules[event.itemIndex];
        if (this.module !== switchModule &&
            this._appService.isModuleActive(switchModule)
        ) {
            this.module = switchModule;
            this._appService.switchModule(this.module);
            this._router.navigate(['app/' +
            this.module.toLowerCase() + '/']);
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
