import { Component, OnInit, Injector } from '@angular/core';
import { ContactGroupServiceProxy, ContactGroupInfoDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'contact-information',
    templateUrl: './contact-information.component.html',
    styleUrls: ['./contact-information.component.less']
})
export class ContactInformationComponent extends AppComponentBase implements OnInit {
    public data: {
        contactInfo: ContactGroupInfoDto
    };

    readonly PERSONAL_TAB_INDEX     = 0;
    readonly BUSINESS_TAB_INDEX     = 1;
    readonly EMPLOYMENT_TAB_INDEX   = 2;
    readonly CONFIDENTIAL_TAB_INDEX = 3;

    seletedTabIndex = this.PERSONAL_TAB_INDEX;
    loadedTabs = [];

    constructor(injector: Injector,
                private _contactGroupService: ContactGroupServiceProxy) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
    }

    checkTabEnabled(tabIndex) {
        return this.seletedTabIndex == tabIndex || this.loadedTabs[tabIndex];
    }

    selectedTabChange(event) {
        this.loadedTabs[this.seletedTabIndex] = true;
        this.loadedTabs[event.index] = true;
        this.seletedTabIndex = event.index;
    }

    ngOnInit() {
        this.data = this._contactGroupService['data'];
    }
}
