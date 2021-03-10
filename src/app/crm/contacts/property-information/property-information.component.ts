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
import { filter, map, switchMap, pluck, finalize, skip, first } from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';
import * as moment from 'moment';

/** Application imports */
import {
    BasementStatus,
    ContactInfoDto, CreateContactAddressInput, HeatingCoolingType,
    LeadInfoDto,
    PropertyDto,
    PropertyServiceProxy,
    PropertyType,
    YardPatioEnum,
    SellPeriod,
    InterestRate,
    ExitStrategy,
    PropertyResident,
    PetFeeType,
    InvoiceSettings,
    PestsType
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AddressDto } from '@app/crm/contacts/addresses/address-dto.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AddressUpdate } from '@app/crm/contacts/addresses/address-update.interface';
import lodashIsEqual from 'lodash/isEqual';
import { FireplaceEnum } from './enums/fireplace.enum';
import { DayOfWeekEnum } from './enums/dayOfWeek.enum';
import { GarbageEnum } from './enums/garbage.enum';
import { ParkingEnum } from './enums/parking.enum';
import { DateHelper } from '@shared/helpers/DateHelper';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppliencesEnum } from './enums/appliences.enum';
import { UtilityTypesEnum } from './enums/utilityTypes.enum';

interface SelectBoxItem {
    displayValue: string;
    value: boolean | string | null | number;
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

    invoiceSettings: InvoiceSettings = new InvoiceSettings();
    currencyFormat = { style: "currency", currency: "USD", useGrouping: true };

    yesNoDropdowns: SelectBoxItem[] = [
        { displayValue: 'Yes', value: true },
        { displayValue: 'No', value: false }
    ];
    receivedNA: SelectBoxItem[] = [
        { displayValue: 'Received', value: true },
        { displayValue: 'N/A', value: false }
    ];
    oneFiveDropdowns: SelectBoxItem[] = [
        { displayValue: '0', value: 0 },
        { displayValue: '1', value: 1 },
        { displayValue: '2', value: 2 },
        { displayValue: '3', value: 3 },
        { displayValue: '4', value: 4 },
        { displayValue: '5', value: 5 }
    ];

    basement: SelectBoxItem[] = Object.values(BasementStatus).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    heatingType: SelectBoxItem[] = Object.values(HeatingCoolingType).map((item: string) => ({
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
    sellPeriods: SelectBoxItem[] = Object.values(SellPeriod).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    interestRates: SelectBoxItem[] = Object.values(InterestRate).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    exitStrategies: SelectBoxItem[] = Object.values(ExitStrategy).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    propertyResidents: SelectBoxItem[] = Object.values(PropertyResident).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    petFeeTypes: SelectBoxItem[] = Object.values(PetFeeType).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    pestsTypes: SelectBoxItem[] = Object.values(PestsType).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: item
    }));
    parking: SelectBoxItem[] = Object.values(ParkingEnum).filter(isNaN).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: ParkingEnum[item]
    }));
    firePlace: SelectBoxItem[] = Object.values(FireplaceEnum).filter(isNaN).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: FireplaceEnum[item]
    }));
    garbageCollection: SelectBoxItem[] = Object.values(GarbageEnum).filter(isNaN).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: GarbageEnum[item]
    }));
    weekDays: SelectBoxItem[] = Object.values(DayOfWeekEnum).filter(isNaN).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: DayOfWeekEnum[item]
    }));
    appliences: SelectBoxItem[] = Object.values(AppliencesEnum).filter(isNaN).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: AppliencesEnum[item]
    }));
    utilityTypes: SelectBoxItem[] = Object.values(UtilityTypesEnum).filter(isNaN).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: UtilityTypesEnum[item]
    }));

    constructor(
        private contactsService: ContactsService,
        private route: ActivatedRoute,
        private propertyServiceProxy: PropertyServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private loadingService: LoadingService,
        private invoicesService: InvoicesService,
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

        this.invoiceSettingsLoad();
    }

    savePropertyInfo(property: PropertyDto) {
        this.property = cloneDeep(property);
        let addr = this.property.address;
        this.propertyAddresses = [
            new AddressDto({
                streetAddress: addr.streetAddress,
                neighborhood: addr.neighborhood,
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
            neighborhood: dialogData.neighborhood,
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
                    neighborhood: dialogData.neighborhood,
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

    get sinceListedDays(): number {
        return this.property && this.property.listedDate
            ? moment().diff(moment(this.property.listedDate), 'days')
            : undefined;
    }
    sinceListedDaysChanged(newValue: number) {
        this.property.listedDate = newValue ?
            moment().startOf('Day').subtract(newValue, "days") :
            undefined
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

    getDateValue(date) {
        return date && date.toDate ? date.toDate() : date;
    }
    dateValueChanged($event, propName: string) {
        this.property[propName] = $event.value && DateHelper.removeTimezoneOffset($event.value, true, 'from');
        this.valueChanged();
    }

    getMultipleValues(propName, items: any[]): number[] {
        let propValue: number = this.property[propName];
        if (propValue == 0) return [0];
        if (!propValue) return [];

        let result: number[] = [];
        items.forEach(item => {
            if (item.value && (item.value & propValue) == item.value)
                result.push(item.value);
        });
        return result;
    }

    tagValueChanged(propName, event) {
        let newValues: number[] = event.value;
        let prevValues: number[] = event.previousValue;
        if (lodashIsEqual(newValues.sort(), prevValues.sort()))
            return;

        let triggerChange = true;
        if (!newValues || !newValues.length) {
            this.property[propName] = null;
        }
        else {
            if (newValues.indexOf(0) >= 0) {
                if (prevValues && prevValues.length == 1 && prevValues[0] == 0) {
                    newValues = newValues.filter(v => v != 0);
                    triggerChange = false;
                }
                else {
                    newValues = [0];
                    triggerChange = prevValues.indexOf(0) < 0;
                }
            }

            this.property[propName] = newValues.reduce((prev, current) => prev | current, 0);
        }

        if (triggerChange)
            this.valueChanged();
    }

    validateProperty(event): void {
        if (event.value)
            this.valueChanged();
    }

    invoiceSettingsLoad() {
        this.invoicesService.settings$.pipe(
            filter(Boolean), first()
        ).subscribe((settings: InvoiceSettings) => {
            this.invoiceSettings = settings;
            this.currencyFormat.currency = settings.currency;
            this.changeDetectorRef.detectChanges();
        });
    }

    ngOnDestroy() {
        this.leadInfoSubscription.unsubscribe();
    }
}