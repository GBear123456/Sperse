import { Component, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { TenantLoginInfoDtoCustomLayoutType } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    selector: 'contact-info-panel',
    templateUrl: './contact-info-panel.component.html',
    styleUrls: ['./contact-info-panel.component.less']
})
export class ContactInfoPanelComponent extends AppComponentBase {
    private _data: any;

    @Input() 
    set data(value) {
        this._data = value;
        if (this.data && this.checkCFOMember())
            this.setTitle(this.data.fullName);
    }
    get data(): any { 
        return this._data;
    }

    constructor(
        injector: Injector,
        private _appSession: AppSessionService
    ) {
        super(injector);
    }

    checkCFOMember() {
        let tenant = this._appSession.tenant;
        return tenant && tenant.customLayoutType == TenantLoginInfoDtoCustomLayoutType.AdvicePeriod;
    }
}
