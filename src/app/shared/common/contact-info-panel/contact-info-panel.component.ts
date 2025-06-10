import { Component, Input } from '@angular/core';
import { LayoutType } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { TitleService } from '@shared/common/title/title.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'contact-info-panel',
    templateUrl: './contact-info-panel.component.html',
    styleUrls: ['./contact-info-panel.component.less']
})
export class ContactInfoPanelComponent {
    private _data: any;

    @Input()
    set data(value) {
        this._data = value;
        if (this.data && this.checkAdvicePeriodLayout())
            this.titleService.setTitle(this.data.fullName);
    }
    get data(): any {
        return this._data;
    }

    constructor(
        private titleService: TitleService,
        private appSession: AppSessionService,
        public profileService: ProfileService
    ) {}

    checkAdvicePeriodLayout() {
        let tenant = this.appSession.tenant;
        return tenant && tenant.customLayoutType == LayoutType.AdvicePeriod;
    }
}
