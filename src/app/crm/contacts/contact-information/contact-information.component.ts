import { Component, OnInit } from '@angular/core';
import { ContactServiceProxy, ContactInfoDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'contact-information',
    templateUrl: './contact-information.component.html',
    styleUrls: ['./contact-information.component.less']
})
export class ContactInformationComponent implements OnInit {
    public data: {
        contactInfo: ContactInfoDto
    };

    constructor(
        private contactService: ContactServiceProxy,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.data = this.contactService['data'];
    }
}
