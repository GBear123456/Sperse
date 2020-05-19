/** Core imports */
import { Component, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { ContactsService } from '../contacts.service';
import { ContactServiceProxy, ContactInfoDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PersonalDetailsService } from '../personal-details/personal-details.service';
import { LifecycleSubjectsService } from '../../../../shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    selector: 'contact-information',
    templateUrl: './contact-information.component.html',
    styleUrls: ['./contact-information.component.less'],
    providers: [ LifecycleSubjectsService ]
})
export class ContactInformationComponent implements OnInit, OnDestroy {
    public data: {
        contactInfo: ContactInfoDto
    };

    private readonly ident = 'ContactInformation';
    private readonly settingsDialogId = 'contact-information-personal-details-dialog';

    constructor(
        private dialog: MatDialog,
        private contactsService: ContactsService,
        private contactService: ContactServiceProxy,
        private personalDetailsService: PersonalDetailsService,
        private lifeCycleService: LifecycleSubjectsService,
        public ls: AppLocalizationService
    ) {
        this.contactsService.contactInfoSubscribe(() => {
            if (this.contactsService.settingsDialogOpened.value)
                this.personalDetailsService.togglePersonalDetailsDialog(this.settingsDialogId, false);
            setTimeout(() => this.updateToolbar());
        }, this.ident);
    }

    ngOnInit() {
        this.data = this.contactService['data'];
    }

    updateToolbar() {
        this.contactsService.toolbarUpdate({
            optionButton: {
                name: 'options',
                options: {
                    checkPressed: () => this.contactsService.settingsDialogOpened.value
                },
                action: () => {
                    this.personalDetailsService.togglePersonalDetailsDialog('contact-information-personal-details-dialog');
                }
            }
        });
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.ident);
        this.lifeCycleService.destroy.next();
    }
}