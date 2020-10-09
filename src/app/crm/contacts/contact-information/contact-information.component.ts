/** Core imports */
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, takeUntil } from 'rxjs/operators';

/** Application imports */
import { ContactsService } from '../contacts.service';
import { ContactServiceProxy, ContactInfoDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PersonalDetailsService } from '../personal-details/personal-details.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';

@Component({
    selector: 'contact-information',
    templateUrl: './contact-information.component.html',
    styleUrls: ['./contact-information.component.less'],
    providers: [ LifecycleSubjectsService ]
})
export class ContactInformationComponent implements OnInit, AfterViewInit, OnDestroy {
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
        this.dialog.closeAll();
        this.contactsService.contactInfoSubscribe(contactInfo => {
            if (contactInfo)
                setTimeout(() => this.updateToolbar());
        }, this.ident);
    }

    ngOnInit() {
        this.data = this.contactService['data'];
    }

    ngAfterViewInit() {
        this.contactsService.settingsDialogOpened$.pipe(
            takeUntil(this.lifeCycleService.destroy$),
            debounceTime(300)
        ).subscribe(opened => {
            this.personalDetailsService.togglePersonalDetailsDialog(this.settingsDialogId, opened);
        });
    }

    updateToolbar() {
        this.contactsService.toolbarUpdate({
            optionButton: {
                name: 'options',
                options: {
                    checkPressed: () => this.contactsService.settingsDialogOpened.value
                },
                action: () => {
                    this.contactsService.toogleSettingsDialog();
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