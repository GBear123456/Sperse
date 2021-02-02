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
import { filter, map, switchMap, pluck, finalize, skip } from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import {
    BasementStatus,
    ContactInfoDto, CreateContactAddressInput, FireplaceType, HeatingCoolingType,
    LeadInfoDto,
    PropertyDto,
    PropertyServiceProxy,
    GarbageCollection,
    PropertyType,
    YardPatioEnum,
    PlatformDayOfWeek
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AddressDto } from '@app/crm/contacts/addresses/address-dto.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AddressUpdate } from '@app/crm/contacts/addresses/address-update.interface';

interface SelectBoxItem {
    displayValue: string;
    value: boolean | string | null;
}

@Component({
    selector: 'property-information',
    templateUrl: 'property-information.component.html',
    styleUrls: [ 'property-information.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyInformationComponent implements OnInit {
    contactInfo$: Observable<ContactInfoDto> = this.contactsService.contactInfo$;
    initialProperty: PropertyDto;
    property: PropertyDto;
    propertyAddresses: AddressDto[];
    leadInfoSubscription: Subscription;
    stylingMode = 'filled';

    yesNoDropdowns: SelectBoxItem[] = [
        { displayValue: 'Yes', value: true },
        { displayValue: 'No', value: false }
    ];
    receivedNA: SelectBoxItem[] = [
        { displayValue: 'Received', value: true },
        { displayValue: 'N/A', value: false }
    ];
    parking: SelectBoxItem[] = [
        { displayValue: this.ls.l('Garage'), value: 'Garage' },
        { displayValue: this.ls.l('Underground'), value: 'Underground' },
        { displayValue: this.ls.l('OutdoorLot'), value: 'OutdoorLot' },
        { displayValue: this.ls.l('DedicatedPad'), value: 'DedicatedPad' },
        { displayValue: this.ls.l('Street'), value: 'Street' },
    ];
    basement: SelectBoxItem[] = Object.values(BasementStatus).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    centralHeating: SelectBoxItem[] = Object.values(HeatingCoolingType).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    firePlace: SelectBoxItem[] = Object.values(FireplaceType).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    garbageCollection: SelectBoxItem[] = Object.values(GarbageCollection).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    propertyTypes: SelectBoxItem[] = Object.values(PropertyType).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    yardPatioValues: SelectBoxItem[] = Object.values(YardPatioEnum).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    weekDays: SelectBoxItem[] = Object.values(PlatformDayOfWeek).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));

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
        let addr = this.property.address;
        this.propertyAddresses = [
            new AddressDto({
                streetAddress: addr.streetAddress,
                city: addr.city,
                stateId: addr.stateId,
                stateName: addr.stateName,
                zip: addr.zip,
                isActive: addr.isActive,
                isConfirmed: addr.isConfirmed,
                usageTypeId: addr.usageTypeId,
                comment: addr.comment,
                contactId: addr.contactId,
                confirmationDate: null,
                country: null,
                id: null
            },
            property.address.countryId)
        ];
    }

    isAddressDefined(addr: AddressDto) {
        return addr && (addr.streetAddress || addr.city || addr.stateName || addr.zip);
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

    validateProperty(event): void {
        if (event.value)
            this.valueChanged();
    }

    ngOnDestroy() {
        this.leadInfoSubscription.unsubscribe();
    }
}