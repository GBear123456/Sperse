import { Component, OnInit, Injector } from '@angular/core';
import { ContactServiceProxy, ContactInfoDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'contact-information',
    templateUrl: './contact-information.component.html',
    styleUrls: ['./contact-information.component.less']
})
export class ContactInformationComponent extends AppComponentBase implements OnInit {
    public data: {
        contactInfo: ContactInfoDto
    };

     constructor(injector: Injector,
        private _contactService: ContactServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.data = this._contactService['data'];
    }
}
