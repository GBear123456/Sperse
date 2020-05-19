/** Core imports */
import { Component, OnInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { takeUntil, skip, distinctUntilChanged } from 'rxjs/operators';

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
    dialogOpened: BehaviorSubject<boolean> = new BehaviorSubject(true);
    dialogOpened$: Observable<boolean> = this.dialogOpened.asObservable().pipe(
        distinctUntilChanged()
    );

    constructor(
        private dialog: MatDialog,
        private contactsService: ContactsService,
        private contactService: ContactServiceProxy,
        private personalDetailsService: PersonalDetailsService,
        private lifeCycleService: LifecycleSubjectsService,
        public ls: AppLocalizationService
    ) {
        this.contactsService.contactInfoSubscribe(() => {
            this.showPersonalDetailsDialog();
            setTimeout(() => this.updateToolbar());
        }, this.ident);
    }

    ngOnInit() {
        this.data = this.contactService['data'];
        this.dialogOpened$.pipe(
            takeUntil(this.lifeCycleService.destroy$),
            skip(1)
        ).subscribe(() => {
            this.updateToolbar();
        })
    }

    updateToolbar() {
        this.contactsService.toolbarUpdate({
            optionButton: {
                name: 'options',
                options: {
                    checkPressed: () => this.dialogOpened.value
                },
                action: () => {
                    this.showPersonalDetailsDialog();
                    this.dialogOpened.next(!this.dialogOpened.value);
                }
            }
        });
    }

    showPersonalDetailsDialog() {
        this.personalDetailsService.showPersonalDetailsDialog('contact-information-personal-details-dialog').subscribe(() => {
            this.dialogOpened.next(false);
        });
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.ident);
        this.lifeCycleService.destroy.next();
    }
}