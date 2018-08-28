import { Component, OnInit, Injector } from '@angular/core';
import { ContactGroupServiceProxy, ContactGroupInfoDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'contact-information',
    templateUrl: './contact-information.component.html',
    styleUrls: ['./contact-information.component.less']
})
export class ContactInformationComponent implements OnInit {
    public data: {
        customerInfo: ContactGroupInfoDto
    };

    constructor(injector: Injector,
                private _contactGroupService: ContactGroupServiceProxy) {
    }

    ngOnInit() {
        this.data = this._contactGroupService['data'];
    }
}
