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

     constructor(injector: Injector,
        private _contactGroupService: ContactGroupServiceProxy
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
    }

    ngOnInit() {
        this.data = this._contactGroupService['data'];
    }
}