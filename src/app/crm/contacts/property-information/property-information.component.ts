/** Core imports */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { Observable, race, Subscription } from 'rxjs';
import { filter, map, switchMap, pluck } from 'rxjs/operators';

/** Application imports */
import {
    ContactInfoDto,
    LeadInfoDto,
    PropertyDto,
    PropertyServiceProxy
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AddressDto } from '@app/crm/contacts/addresses/address-dto.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'property-information',
    templateUrl: 'property-information.component.html',
    styleUrls: [ 'property-information.component.less' ],
    providers: [ PropertyServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyInformationComponent implements OnInit {
    contactInfo$: Observable<ContactInfoDto> = this.contactsService.contactInfo$;
    property: PropertyDto;
    propertyAddresses: AddressDto[];
    leadInfoSubscription: Subscription;

    constructor(
        private contactsService: ContactsService,
        private route: ActivatedRoute,
        private propertyServiceProxy: PropertyServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.leadInfoSubscription = race(
            this.contactsService.leadInfo$.pipe(
                filter(Boolean),
                map((leadInfo: LeadInfoDto) => leadInfo.propertyId)
            ),
            this.route.queryParams.pipe(
                pluck('propertyId'),
                filter(Boolean)
            )
        ).pipe(
            switchMap((propertyId: number) => {
                return this.propertyServiceProxy.getPropertyDetails(propertyId);
            })
        ).subscribe((property: PropertyDto) => {
            this.property = property;
            this.propertyAddresses = [
                new AddressDto({
                    streetAddress: property.address.streetAddress,
                    city: property.address.city,
                    stateId: property.address.stateId,
                    stateName: property.address.stateName,
                    zip: property.address.zip,
                    isActive: property.address.isActive,
                    isConfirmed: property.address.isConfirmed,
                    usageTypeId: property.address.usageTypeId,
                    comment: property.address.comment,
                    contactId: property.address.contactId,
                    confirmationDate: null,
                    country: null,
                    id: null
                })
            ];
            this.changeDetectorRef.detectChanges();
        })
    }

    valueChanged() {}

    ngOnDestroy() {
        this.leadInfoSubscription.unsubscribe();
    }
}