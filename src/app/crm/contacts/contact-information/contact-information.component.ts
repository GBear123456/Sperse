/** Core imports */
import { Component, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { ContactsService } from '../contacts.service';
import { ContactServiceProxy, ContactInfoDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PersonalDetailsDialogComponent } from '../personal-details/personal-details-dialog/personal-details-dialog.component';

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
        public ls: AppLocalizationService
    ) {
        this.contactsService.contactInfoSubscribe(() => {
            this.showPersonalDetailsDialog();
            setTimeout(() => this.contactsService.toolbarUpdate({
                optionButton: {
                    name: 'options',
                    action: this.showPersonalDetailsDialog.bind(this)
                }
            }));
        });
    }

    ngOnInit() {
        this.data = this.contactService['data'];
    }

    showPersonalDetailsDialog() {
        setTimeout(() =>
            this.dialog.open(PersonalDetailsDialogComponent, {
                panelClass: ['slider'],
                disableClose: false,
                hasBackdrop: false,
                closeOnNavigation: true,
                data: {}
            })
        );
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
    }
}