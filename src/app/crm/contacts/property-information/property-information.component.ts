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
import { Observable, Subscription, merge, forkJoin, of } from 'rxjs';
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
    PestsType,
    PropertySellerDto
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
import { AppliancesEnum } from './enums/appliances.enum';
import { UtilityTypesEnum } from './enums/utilityTypes.enum';
import { EntityTypeSys } from '@app/crm/leads/entity-type-sys.enum';

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
    initialPropertySellerDto: PropertySellerDto;
    propertySellerDto: PropertySellerDto;
    propertyAddresses: AddressDto[];
    leadInfoSubscription: Subscription;
    leadTypesWithInstallment = [
        EntityTypeSys.PropertyRentAndSale,
        EntityTypeSys.PropertyRentAndSaleAirbnbSysId,
        EntityTypeSys.PropertyRentAndSaleJVSysId,
        EntityTypeSys.PropertyRentAndSaleLTRSysId,
        EntityTypeSys.PropertyRentAndSaleSTRSysId
    ];
    stylingMode = 'filled';

    invoiceSettings: InvoiceSettings = new InvoiceSettings();
    showContractDetails: boolean = false;
    currencyFormat = { style: "currency", currency: "USD", useGrouping: true };

    yesNoDropdowns: SelectBoxItem[] = [
        { displayValue: 'Yes', value: true },
        { displayValue: 'No', value: false }
    ];
    receivedNA: SelectBoxItem[] = [
        { displayValue: 'Received', value: true },
        { displayValue: 'N/A', value: false }
    ];

    oneFiveDropdowns = Array(6).fill(0).map((v, i) => i);

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
    appliances: SelectBoxItem[] = Object.values(AppliancesEnum).filter(isNaN).map((item: string) => ({
        displayValue: this.ls.l(item),
        value: AppliancesEnum[item]
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
        const leadInfo$ = this.contactsService.leadInfo$.pipe(
            filter(Boolean)
        );
        this.leadInfoSubscription = merge(
            leadInfo$,
            /** Then listen only for lead info property id */
            leadInfo$.pipe(skip(1))
        ).pipe(
            filter(Boolean),
            switchMap((leadInfo: LeadInfoDto) => {
                this.showContractDetails = leadInfo.typeSysId == EntityTypeSys.PropertyAcquisition;
                let sellerDetails = this.showContractDetails ? this.propertyServiceProxy.getSellerPropertyDetails(leadInfo.propertyId) : of(new PropertySellerDto());
                return forkJoin(this.propertyServiceProxy.getPropertyDetails(leadInfo.propertyId),
                    sellerDetails);
            })
        ).subscribe(([property, sellerDto]) => {
            this.initialProperty = property;
            this.initialPropertySellerDto = sellerDto;
            this.propertySellerDto = sellerDto;
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
                countryId: addr.countryId,
                countryName: addr.countryName,
                id: null
            })
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
            countryId: dialogData.countryId,
            countryName: dialogData.countryName,
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
                    countryId: dialogData.countryId,
                    countryName: dialogData.countryName,
                    id: null
                })
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
        return this.propertySellerDto && this.propertySellerDto.listedDate
            ? moment().diff(moment(this.propertySellerDto.listedDate), 'days')
            : undefined;
    }
    sinceListedDaysChanged(newValue: number) {
        this.propertySellerDto.listedDate = newValue ?
            moment().startOf('Day').subtract(newValue, "days") :
            undefined
        this.sellerValueChanged();
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

    sellerValueChanged() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.propertyServiceProxy.updateSellerPropertyDetails(this.property.id, this.propertySellerDto).pipe(
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).subscribe(
            () => { },
            () => {
                this.propertySellerDto = cloneDeep(this.initialPropertySellerDto);
                this.changeDetectorRef.detectChanges();
            }
        );
    }

    getDateValue(date) {
        return date && date.toDate ? date.toDate() : date;
    }
    dateValueChanged($event, propName: string, isSellerProperty = false) {
        let newValue = $event.value && DateHelper.removeTimezoneOffset($event.value, true, 'from');
        if (isSellerProperty) {
            this.propertySellerDto[propName] = newValue;
            this.sellerValueChanged();
        }
        else {
            this.property[propName] = newValue;
            this.valueChanged();
        }
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