/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { Observable, Subscription, merge, race } from 'rxjs';
import { filter, map, switchMap, pluck, finalize, skip, tap } from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import {
    ContactInfoDto, CreateContactAddressInput,
    LeadInfoDto,
    PropertyDto,
    PropertyServiceProxy
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AddressDto } from '@app/crm/contacts/addresses/address-dto.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AddressUpdate } from '@app/crm/contacts/addresses/address-update.interface';

@Component({
    selector: 'property-information',
    templateUrl: 'property-information.component.html',
    styleUrls: [ 'property-information.component.less' ],
    providers: [ PropertyServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyInformationComponent implements OnInit {
    contactInfo$: Observable<ContactInfoDto> = this.contactsService.contactInfo$;
    initialProperty: PropertyDto;
    property: PropertyDto;
    propertyAddresses: AddressDto[];
    leadInfoSubscription: Subscription;

    constructor(
        private contactsService: ContactsService,
        private route: ActivatedRoute,
        private propertyServiceProxy: PropertyServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private loadingService: LoadingService,
        private elementRef: ElementRef,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        const leadPropertyId$: Observable<number> = this.contactsService.leadInfo$.pipe(
            filter(Boolean),
            map((leadInfo: LeadInfoDto) => leadInfo.propertyId)
        );
        this.leadInfoSubscription = merge(
            race(
                /** Get property id from lead info */
                leadPropertyId$,
                /** Or from query params depends on fastest source */
                this.route.queryParams.pipe(
                    pluck('propertyId'),
                    filter(Boolean)
                )
            ),
            /** Then listen only for lead info property id */
            leadPropertyId$.pipe(skip(1))
        ).pipe(
            filter(Boolean),
            switchMap((propertyId: number) => {
                return this.propertyServiceProxy.getPropertyDetails(propertyId);
            })
        ).subscribe((property: PropertyDto) => {
            this.initialProperty = property;
            this.savePropertyInfo(property);
            this.changeDetectorRef.detectChanges();
        });
    }

    savePropertyInfo(property: PropertyDto) {
        this.property = cloneDeep(property);
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
            },
            property.address.countryId)
        ];
    }

    updateAddress({ address, dialogData }: AddressUpdate) {
        this.property.address = new CreateContactAddressInput({
            contactId: dialogData.contactId,
            streetAddress: dialogData.streetAddress,
            city: dialogData.city,
            stateId: dialogData.stateId,
            stateName: dialogData.stateName,
            zip: dialogData.zip,
            countryId: dialogData.countryCode,
            startDate: undefined,
            endDate: undefined,
            isActive: dialogData.isActive,
            isConfirmed: dialogData.isConfirmed,
            comment: dialogData.comment,
            usageTypeId: null,
            ownershipTypeId: null
        });
        this.property.name = dialogData.formattedAddress || address.autoComplete;
        this.valueChanged(() => {
            this.propertyAddresses = [
                new AddressDto({
                    streetAddress: dialogData.streetAddress,
                    city: dialogData.city,
                    stateId: dialogData.stateId,
                    stateName: dialogData.stateName,
                    zip: dialogData.zip,
                    isActive: dialogData.isActive,
                    isConfirmed: dialogData.isConfirmed,
                    usageTypeId: null,
                    comment: dialogData.comment,
                    contactId: null,
                    confirmationDate: null,
                    country: dialogData.country,
                    id: null
                }, dialogData.countryCode)
            ];
            this.changeDetectorRef.detectChanges();
        });
    }

    get yearBuilt(): Date {
        return this.property && this.property.yearBuilt
            ? new Date(this.property.yearBuilt + '-01-01T00:00:00')
            : undefined;
    }

    yearBuiltChanged(newValue: Date) {
        this.property.yearBuilt = newValue.getFullYear();
        this.valueChanged();
    }

    valueChanged(successCallback?: () => void) {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.propertyServiceProxy.updatePropertyDetails(this.property).pipe(
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).subscribe(
            successCallback,
            () => {
                this.property = cloneDeep(this.initialProperty);
                this.savePropertyInfo(this.property);
                this.changeDetectorRef.detectChanges();
            }
        );
    }

    ngOnDestroy() {
        this.leadInfoSubscription.unsubscribe();
    }
}