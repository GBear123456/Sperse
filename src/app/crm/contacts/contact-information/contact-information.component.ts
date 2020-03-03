/** Core imports */
import { Component, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { ContactsService } from '../contacts.service';
import { ContactServiceProxy, ContactInfoDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PersonalDetailsService } from '../personal-details/personal-details.service';

@Component({
    selector: 'contact-information',
    templateUrl: './contact-information.component.html',
    styleUrls: ['./contact-information.component.less']
})
export class ContactInformationComponent implements OnInit, OnDestroy {
    public data: {
        contactInfo: ContactInfoDto
    };

    constructor(
        private dialog: MatDialog,
        private contactsService: ContactsService,
        private contactService: ContactServiceProxy,
        private personalDetailsService: PersonalDetailsService,
        public ls: AppLocalizationService
    ) {
        this.contactsService.contactInfoSubscribe(() => {
            this.personalDetailsService.showPersonalDetailsDialog();
            setTimeout(() => this.contactsService.toolbarUpdate({
                optionButton: {
                    name: 'options',
                    action: this.personalDetailsService.showPersonalDetailsDialog.bind(this)
                }
            }));
        }, this.constructor.name);
    }

    ngOnInit() {
        this.data = this.contactService['data'];
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.constructor.name);
    }
}