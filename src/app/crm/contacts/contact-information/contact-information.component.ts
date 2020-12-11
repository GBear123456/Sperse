/** Core imports */
import { Component, AfterViewInit, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, filter, map, takeUntil } from 'rxjs/operators';

/** Application imports */
import { ContactsService } from '../contacts.service';
import {
    ContactServiceProxy,
    ContactInfoDto,
    UpdateContactAddressInput,
    CreateContactAddressInput,
    ContactAddressServiceProxy,
    ContactAddressDto,
    LeadInfoDto,
    ContactStarInfoDto, ContactListInfoDto, ContactTagInfoDto
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PersonalDetailsService } from '../personal-details/personal-details.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { AddressDto } from '@app/crm/contacts/addresses/address-dto.model';
import { AppStore, TagsStoreSelectors, ListsStoreSelectors, StarsStoreSelectors } from '@app/store';

@Component({
    selector: 'contact-information',
    templateUrl: './contact-information.component.html',
    styleUrls: ['./contact-information.component.less'],
    providers: [ LifecycleSubjectsService ]
})
export class ContactInformationComponent implements AfterViewInit, OnDestroy {
    public data: {
        contactInfo: ContactInfoDto,
        leadInfo: LeadInfoDto
    };

    private readonly ident = 'ContactInformation';
    private readonly settingsDialogId = 'contact-information-personal-details-dialog';
    tags$: Observable<ContactTagInfoDto[]> = this.store$.pipe(select(TagsStoreSelectors.getStoredTags));
    lists$: Observable<ContactListInfoDto[]> = this.store$.pipe(select(ListsStoreSelectors.getStoredLists));
    star$: Observable<ContactStarInfoDto> = combineLatest(
        this.contactsService.contactInfo$.pipe(
            filter(Boolean),
            map((contactInfo: ContactInfoDto) => contactInfo.starId)
        ),
        this.store$.select(StarsStoreSelectors.getStars)
    ).pipe(
        map(([starId, stars]: [number, ContactStarInfoDto[]]) => {
            return stars.find((star: ContactStarInfoDto) => star.id === starId);
        })
    );

    constructor(
        private dialog: MatDialog,
        private contactsService: ContactsService,
        private contactService: ContactServiceProxy,
        private personalDetailsService: PersonalDetailsService,
        private lifeCycleService: LifecycleSubjectsService,
        private addressServiceProxy: ContactAddressServiceProxy,
        public ls: AppLocalizationService,
        private store$: Store<AppStore.State>
    ) {
        this.dialog.closeAll();
        this.contactsService.contactInfoSubscribe((contactInfo: ContactInfoDto) => {
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

    updateAddress({ address, dialogData }, addresses: ContactAddressDto[]) {
        this.addressServiceProxy
            [(address ? 'update' : 'create') + 'ContactAddress'](
            (address ? UpdateContactAddressInput : CreateContactAddressInput).fromJS(dialogData)
        ).subscribe(result => {
            if (!result && address) {
                address.city = dialogData.city;
                address.country = dialogData.country;
                address.isActive = dialogData.isActive;
                address.isConfirmed = dialogData.isConfirmed;
                address.stateId = dialogData.stateId;
                address.stateName = dialogData.stateName;
                address.streetAddress = dialogData.streetAddress;
                address.comment = dialogData.comment;
                address.usageTypeId = dialogData.usageTypeId;
                address.zip = dialogData.zip;
            } else if (result.id) {
                addresses.push(AddressDto.fromJS(dialogData));
            }
            this.contactsService.verificationUpdate();
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
                    this.contactsService.toggleSettingsDialog();
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