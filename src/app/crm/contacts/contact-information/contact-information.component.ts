/** Core imports */
import {
    AfterContentChecked,
    AfterViewInit,
    Component,
    OnDestroy,
} from "@angular/core";

/** Third party imports */
import { MatDialog } from "@angular/material/dialog";
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable, Subscription } from "rxjs";
import { filter, map, takeUntil } from "rxjs/operators";

/** Application imports */
import { AddressDto } from "@app/crm/contacts/addresses/address-dto.model";
import { AppLocalizationService } from "@app/shared/common/localization/app-localization.service";
import { LayoutService } from "@app/shared/layout/layout.service";
import {
    AppStore,
    ListsStoreSelectors,
    StarsStoreSelectors,
    TagsStoreSelectors,
} from "@app/store";
import invert from "lodash/invert";
import { ContactGroup } from "@root/shared/AppEnums";
import { LifecycleSubjectsService } from "@shared/common/lifecycle-subjects/lifecycle-subjects.service";
import {
    ContactAddressDto,
    ContactAddressServiceProxy,
    ContactInfoDto,
    ContactListInfoDto,
    ContactServiceProxy,
    ContactStarInfoDto,
    ContactTagInfoDto,
    CreateContactAddressInput,
    LeadInfoDto,
    UpdateContactAddressInput,
} from "@shared/service-proxies/service-proxies";
import { ContactsService } from "../contacts.service";
import { PersonalDetailsService } from "../personal-details/personal-details.service";

@Component({
    selector: "contact-information",
    templateUrl: "./contact-information.component.html",
    styleUrls: ["./contact-information.component.less"],
    providers: [LifecycleSubjectsService],
})
export class ContactInformationComponent implements AfterViewInit, OnDestroy {
    public data: {
        contactInfo: ContactInfoDto;
        leadInfo: LeadInfoDto;
    };

    private readonly ident = "ContactInformation";
    private readonly settingsDialogId =
        "contact-information-personal-details-dialog";
    tags$: Observable<ContactTagInfoDto[]> = this.store$.pipe(
        select(TagsStoreSelectors.getStoredTags)
    );
    lists$: Observable<ContactListInfoDto[]> = this.store$.pipe(
        select(ListsStoreSelectors.getStoredLists)
    );
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
    settingsDialog$: Subscription;

    /* my modifications */
    groups = [];

    lists = [];
    tags = [];
    rating = 6;
    maxRating = 10;
    /* end my modif*/

    constructor(
        private dialog: MatDialog,
        private contactsService: ContactsService,
        private contactService: ContactServiceProxy,
        private personalDetailsService: PersonalDetailsService,
        private lifeCycleService: LifecycleSubjectsService,
        private addressServiceProxy: ContactAddressServiceProxy,
        public ls: AppLocalizationService,
        public layoutService: LayoutService,
        private store$: Store<AppStore.State>
    ) {
        this.dialog.closeAll();
        this.contactsService.contactInfoSubscribe(
            (contactInfo: ContactInfoDto) => {
                if (contactInfo) {
                    setTimeout(() => {
                        this.loadTagsAndGroups();
                        this.updateToolbar();
                    });
                    if (contactInfo.parentId) {
                        this.contactsService.closeSettingsDialog(false);
                    }
                }
            },
            this.ident
        );
    }
    loadTagsAndGroups(): void {
        if (this.data.contactInfo.tags) {
            this.tags$
                .pipe(takeUntil(this.lifeCycleService.destroy$))
                .subscribe((tags: ContactTagInfoDto[]) => {
                    if (tags && tags.length > 0) {
                        this.tags = tags
                            .filter((tag: ContactTagInfoDto) =>
                                this.data.contactInfo.tags.some(
                                    (t: number) => t === tag.id
                                )
                            )
                            .map((tag: ContactTagInfoDto) => tag.name);
                    }
                });
            this.lists$
                .pipe(takeUntil(this.lifeCycleService.destroy$))
                .subscribe((tags: ContactTagInfoDto[]) => {
                    if (tags && tags.length > 0) {
                        this.lists = tags
                            .filter((tag: ContactListInfoDto) =>
                                this.data.contactInfo.lists.some(
                                    (t: number) => t === tag.id
                                )
                            )
                            .map((tag: ContactListInfoDto) => tag.name);
                    }
                });
            this.data.contactInfo.groups &&
            this.data.contactInfo.groups.length > 0
                ? (this.groups = this.data.contactInfo.groups.map((group) => {
                      var groupName = invert(ContactGroup)[group.groupId];
                      return {
                          name: groupName,
                          className: `chip-${groupName.toLowerCase()}`,
                      };
                  }))
                : [];
        }
    }

    ngOnInit() {
        this.data = this.contactService["data"];
        this.layoutService.showTopBar = false;
        this.layoutService.showContactDetailsDialog = true;
    }

    ngAfterViewInit() {
        this.contactsService.settingsDialogOpened$
            .pipe(takeUntil(this.lifeCycleService.destroy$))
            .subscribe((opened) => {
                let isOpened =
                    this.data.contactInfo && this.data.contactInfo.parentId
                        ? false
                        : opened;
                this.personalDetailsService.togglePersonalDetailsDialog(
                    this.settingsDialogId,
                    isOpened
                );
            });
    }

    updateAddress({ address, dialogData }, addresses: ContactAddressDto[]) {
        this.addressServiceProxy[
            (address ? "update" : "create") + "ContactAddress"
        ](
            (address
                ? UpdateContactAddressInput
                : CreateContactAddressInput
            ).fromJS(dialogData)
        ).subscribe((result) => {
            if (!result && address) {
                address.city = dialogData.city;
                address.countryId = dialogData.countryId;
                address.countryName = dialogData.countryName;
                address.isActive = dialogData.isActive;
                address.isConfirmed = dialogData.isConfirmed;
                address.stateId = dialogData.stateId;
                address.stateName = dialogData.stateName;
                address.streetAddress = dialogData.streetAddress;
                address.comment = dialogData.comment;
                address.usageTypeId = dialogData.usageTypeId;
                address.zip = dialogData.zip;
            } else if (result.id) {
                let address = AddressDto.fromJS(dialogData);
                address.id = result.id;
                addresses.push(address);
            }
            this.contactsService.verificationUpdate();
        });
    }

    updateToolbar() {
        let toolbarConfig = this.layoutService.showModernLayout
            ? null
            : {
                  optionButton: {
                      name: "options",
                      options: {
                          checkPressed: () =>
                              this.contactsService.settingsDialogOpened.value,
                      },
                      action: () => {
                          this.contactsService.toggleSettingsDialog();
                      },
                  },
              };

        this.contactsService.toolbarUpdate(
            this.data && !this.data.contactInfo.parentId ? toolbarConfig : null
        );
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.ident);
        this.personalDetailsService.togglePersonalDetailsDialog(
            this.settingsDialogId,
            false
        );
        this.lifeCycleService.destroy.next();
        this.layoutService.showTopBar = !this.layoutService.showLeftBar;
        this.layoutService.showContactDetailsDialog = false;
    }
}
