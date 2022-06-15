/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

/** Third party imports */
import { AppConsts } from '@shared/AppConsts';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subscription, merge, forkJoin, of } from 'rxjs';
import { filter, map, switchMap, pluck, finalize, skip, first } from 'rxjs/operators';
import { NotifyService } from 'abp-ng2-module';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import cloneDeep from 'lodash/cloneDeep';
import * as moment from 'moment';

/** Application imports */
import {
    BasementStatus,
    ContactInfoDto, CreateContactAddressInput, HeatingCoolingType,
    LeadInfoDto,
    PropertyDto,
    PropertyServiceProxy,
    LeadServiceProxy,
    UpdateLeadDealInfoInput,
    PropertyType,
    YardPatioEnum,
    SellPeriod,
    InterestRate,
    ExitStrategy,
    PropertyResident,
    PetFeeType,
    InvoiceSettings,
    PestsType,
    PropertyAcquisitionDto,
    PropertyInvestmentDto,
    PropertyDealInfo,
    CreateContactPhotoInput,
    ContactPhotoServiceProxy
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
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { UploadPhotoData } from '@app/shared/common/upload-photo-dialog/upload-photo-data.interface';
import { UploadPhotoResult } from '@app/shared/common/upload-photo-dialog/upload-photo-result.interface';
import { StringHelper } from '@shared/helpers/StringHelper';

interface SelectBoxItem {
    displayValue: string;
    value: boolean | string | null | number;
}

@Component({
    selector: 'property-information',
    templateUrl: 'property-information.component.html',
    styleUrls: ['property-information.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [CurrencyPipe]
})
export class PropertyInformationComponent implements OnInit {
    contactInfo$: Observable<ContactInfoDto> = this.contactsService.contactInfo$;
    initialProperty: PropertyDto;
    property: PropertyDto;
    initialPropertyAcquisitionDto: PropertyAcquisitionDto;
    propertyAcquisitionDto: PropertyAcquisitionDto;
    initialPropertyInvestmentDto: PropertyInvestmentDto;
    propertyInvestmentDto: PropertyInvestmentDto;
    propertyAddresses: AddressDto[];
    acquisitionLeadDealInfo: PropertyDealInfo;
    disableEdit = true;
    leadInfoSubscription: Subscription;
    leadTypesWithInstallment = [
        EntityTypeSys.PropertyRentAndSale,
        EntityTypeSys.PropertyRentAndSaleAirbnbSysId,
        EntityTypeSys.PropertyRentAndSaleJVSysId,
        EntityTypeSys.PropertyRentAndSaleLTRSysId,
        EntityTypeSys.PropertyRentAndSaleSTRSysId
    ];
    stylingMode = 'filled';

    phoneRegEx = AppConsts.regexPatterns.phone;
    emailRegEx = AppConsts.regexPatterns.email;
    invoiceSettings: InvoiceSettings = new InvoiceSettings();
    showContractDetails = false;
    currencyFormat = { style: 'currency', currency: 'USD', useGrouping: true };

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
        private dialog: MatDialog,
        private contactsService: ContactsService,
        private route: ActivatedRoute,
        private profileService: ProfileService,
        private propertyServiceProxy: PropertyServiceProxy,
        private contactPhotoServiceProxy: ContactPhotoServiceProxy,
        private leadServiceProxy: LeadServiceProxy,
        public changeDetectorRef: ChangeDetectorRef,
        private loadingService: LoadingService,
        private invoicesService: InvoicesService,
        private elementRef: ElementRef,
        private permission: AppPermissionService,
        private notify: NotifyService,
        private currencyPipe: CurrencyPipe,
        public ls: AppLocalizationService
    ) { }

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
                let acquisitionDetails = this.showContractDetails ? this.propertyServiceProxy.getPropertyAcquisitionDetails(leadInfo.propertyId) : of(new PropertyAcquisitionDto());
                let investmentDetails = this.showContractDetails ? this.propertyServiceProxy.getPropertyInvestmentDetails(leadInfo.propertyId) : of(new PropertyInvestmentDto());
                let deals = this.showContractDetails ? this.propertyServiceProxy.getDeals(leadInfo.propertyId) : of(<PropertyDealInfo[]>[]);
                return forkJoin(this.propertyServiceProxy.getPropertyDetails(leadInfo.propertyId),
                    acquisitionDetails, investmentDetails, deals, of(leadInfo));
            })
        ).subscribe(([property, acquisitionDto, investmentDto, deals, leadInfo]) => {
            this.initialProperty = property;
            this.initialPropertyAcquisitionDto = this.propertyAcquisitionDto = acquisitionDto;
            this.initialPropertyInvestmentDto = this.propertyInvestmentDto = investmentDto;
            this.savePropertyInfo(property);
            this.acquisitionLeadDealInfo = deals.find(v => v.leadTypeSysId == EntityTypeSys.PropertyAcquisition);
            this.disableEdit = !this.permission.checkCGPermission([leadInfo.contactGroupId]);
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
                id: null,
                confirmedByUserId: undefined,
                confirmedByUserFullName: undefined
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
                    id: null,
                    confirmedByUserId: undefined,
                    confirmedByUserFullName: undefined
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
        return this.propertyAcquisitionDto && this.propertyAcquisitionDto.listedDate
            ? moment().diff(moment(this.propertyAcquisitionDto.listedDate), 'days')
            : undefined;
    }
    sinceListedDaysChanged(newValue: number) {
        this.propertyAcquisitionDto.listedDate = newValue ?
            moment().startOf('Day').subtract(newValue, 'days') :
            undefined;
        this.acquisitionValueChanged();
    }

    getPreparationCosts() {
        return this.sumPropertyValues(this.propertyInvestmentDto.renovations,
            this.propertyInvestmentDto.cleaning,
            this.propertyInvestmentDto.inspection,
            this.propertyInvestmentDto.legalFees,
            this.propertyInvestmentDto.otherPreparationFees);
    }

    getPurchaseTermMonths(): number {
        return this.getMonthsDifference(this.propertyInvestmentDto.purchaseTermFrom, this.propertyInvestmentDto.purchaseTermTo);
    }

    getMonthlyHoldingCost() {
        return this.sumPropertyValues(this.propertyInvestmentDto.monthlyMortgagePayments,
            this.propertyInvestmentDto.monthlyTaxes,
            this.propertyInvestmentDto.monthlyInsurance,
            this.propertyInvestmentDto.monthlyCondoFees,
            this.propertyInvestmentDto.otherMonthlyFees);
    }

    getTotalUtilizedHoldingCosts() {
        return (this.propertyInvestmentDto.termUtilizedMonths || 0) * this.getMonthlyHoldingCost();
    }

    getInvestmentTotalFees() {
        return this.sumPropertyValues(this.propertyInvestmentDto.equityPaidToHomeowner,
            this.propertyInvestmentDto.referralFee,
            this.getPreparationCosts(),
            this.getTotalUtilizedHoldingCosts());
    }

    getInvestmentTotalPurchase() {
        return this.getInvestmentTotalFees() + (this.acquisitionLeadDealInfo && this.acquisitionLeadDealInfo.dealAmount || 0);
    }

    getRTOTermMonths() {
        return this.getMonthsDifference(this.propertyInvestmentDto.rtoTermFrom, this.propertyInvestmentDto.rtoTermTo);
    }

    getAmountAboveHolding() {
        return (this.propertyInvestmentDto.rtoMonthlyPayment || 0) - this.getMonthlyHoldingCost();
    }

    getTermAmountAboveHolding() {
        return this.getRTOTermMonths() * this.getAmountAboveHolding();
    }

    getTermMortgagePaydown() {
        return (this.propertyInvestmentDto.monthlyMortgagePayments || 0) * (this.propertyInvestmentDto.rtoMortgagePaydownRate || 0) * this.getPurchaseTermMonths();
    }

    getTotalProfit() {
        return this.getTermAmountAboveHolding() + (this.getTermMortgagePaydown() || 0);
    }

    getTotalSale() {
        return this.getTotalProfit() + (this.propertyInvestmentDto.rtoPurchasePrice || 0);
    }

    getTermMortgagePaydownDetails() {
        let months = this.getPurchaseTermMonths();
        if (!this.propertyInvestmentDto.rtoMortgagePaydownRate || !months)
            return '';
        let mortgagePercentAmount = this.propertyInvestmentDto.monthlyMortgagePayments * this.propertyInvestmentDto.rtoMortgagePaydownRate;
        return `(based on ${(+this.propertyInvestmentDto.rtoMortgagePaydownRate * 100).toFixed(2)}% of mortgage payment amount ${this.currencyPipe.transform(+mortgagePercentAmount.toFixed(2), this.currencyFormat.currency)}x${months})`;
    }

    getGrandTotalProfit(): number {
        return this.getTotalSale() - this.getInvestmentTotalPurchase();
    }

    sumPropertyValues(...values: number[]): number {
        return values.reduce((prev, current) => prev + current || 0, 0);
    }

    getMonthsDifference(dateFrom, dateTo): number {
        if (!dateFrom || !dateTo)
            return 0;

        const daysInMonth = 365.2425 / 12;
        let days = moment(dateTo).diff(moment(dateFrom), 'days');
        return Math.round(days / daysInMonth);
    }

    getMonthYearString(months: number): string {
        let years = Math.floor(months / 12);
        let month = months - years * 12;
        let result = '';
        if (years)
            result += `${years} ${this.ls.l('year(s)')}`;
        if (month)
            result += ` ${month} ${this.ls.l('month(s)')}`;
        return result;
    }

    checkSetFieldChanged(event, field) {
        if (event.component.option('isValid')) {
            this.property[field] = event.value;
            this.valueChanged();
        }
    }

    valueChanged(successCallback?: () => void) {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.propertyServiceProxy.updatePropertyDetails(this.property).pipe(
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).subscribe(() => {
                this.initialProperty = cloneDeep(this.property);
                successCallback && successCallback();
            }, () => {
                this.property = cloneDeep(this.initialProperty);
                this.savePropertyInfo(this.property);
                this.changeDetectorRef.detectChanges();
            }
        );
    }

    acquisitionValueChanged() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.propertyServiceProxy.updatePropertyAcquisitionDetails(this.propertyAcquisitionDto).pipe(
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).subscribe(
            () => {
                this.initialPropertyAcquisitionDto = cloneDeep(this.propertyAcquisitionDto);
            },
            () => {
                this.propertyAcquisitionDto = cloneDeep(this.initialPropertyAcquisitionDto);
                this.changeDetectorRef.detectChanges();
            }
        );
    }

    investmentValueChanged() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.propertyServiceProxy.updatePropertyInvestmentDetails(this.propertyInvestmentDto).pipe(
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).subscribe(
            () => {
                this.initialPropertyInvestmentDto = cloneDeep(this.propertyInvestmentDto);
            },
            () => {
                this.propertyInvestmentDto = cloneDeep(this.initialPropertyInvestmentDto);
                this.changeDetectorRef.detectChanges();
            }
        );
    }

    dealInfoChanged($event) {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.leadServiceProxy.updateDealInfo(new UpdateLeadDealInfoInput({
            leadId: this.acquisitionLeadDealInfo.leadId,
            dealAmount: this.acquisitionLeadDealInfo.dealAmount,
            installmentAmount: this.acquisitionLeadDealInfo.installmentAmount
        })).pipe(
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).subscribe(() => { });
    }

    getDateValue(date) {
        return date && date.toDate ? date.toDate() : date;
    }
    dateValueChanged($event, propName: string, objectType: 'property' | 'acquisitionProp' | 'investmentProp') {
        let newValue = $event.value && DateHelper.removeTimezoneOffset($event.value, true, 'from');
        switch (objectType) {
            case 'property':
                this.property[propName] = newValue;
                this.valueChanged();
                break;
            case 'acquisitionProp':
                this.propertyAcquisitionDto[propName] = newValue;
                this.acquisitionValueChanged();
                break;
            case 'investmentProp':
                this.propertyInvestmentDto[propName] = newValue;
                this.investmentValueChanged();
                break;
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
        } else {
            if (newValues.indexOf(0) >= 0) {
                if (prevValues && prevValues.length == 1 && prevValues[0] == 0) {
                    newValues = newValues.filter(v => v != 0);
                    triggerChange = false;
                } else {
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

    getPhoto(): string {
        return 'url(' + ( this.property.photo ?
            this.profileService.getPhoto(this.property.photo) :
            'assets/common/images/no-photo-Organization.png') +
        ')';
    }

    showUploadPhotoDialog(event) {
        if (this.disableEdit)
            return ;

        this.dialog.closeAll();
        let data: UploadPhotoData = {
            source: this.property.photo ? this.profileService.getPhoto(this.property.photo) : '',
            title: this.ls.l('ChangePropertyPhoto')
        };
        this.dialog.open(UploadPhotoDialogComponent, {
            data: data,
            hasBackdrop: true
        }).afterClosed()
            .pipe(filter(Boolean))
            .subscribe((result: UploadPhotoResult) => {
                if (result.clearPhoto) {
                    this.contactPhotoServiceProxy.clearContactPhoto(
                        this.property.id
                    ).subscribe(() => {
                        this.property.photo = null;
                        this.changeDetectorRef.detectChanges();
                    });
                } else {
                    let base64OrigImage = StringHelper.getBase64(result.origImage),
                        base64ThumbImage = StringHelper.getBase64(result.thumbImage);
                    this.contactPhotoServiceProxy.createContactPhoto(
                        CreateContactPhotoInput.fromJS({
                            contactId: this.property.id,
                            original: base64OrigImage,
                            thumbnail: base64ThumbImage,
                            source: result.source
                        })).subscribe((result: string) => {
                            this.property.photo = base64OrigImage;
                            this.changeDetectorRef.detectChanges();
                        });
                }
        });
        event.stopPropagation();
    }

    generatePdf() {
        this.loadingService.startLoading(this.elementRef.nativeElement);
        this.propertyServiceProxy.generateInvestmentPdf(this.property.id).pipe(
            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
        ).subscribe((urlInfo) => {
            this.notify.info(this.ls.l('SuccessfullyGenerated'));
            window.open(urlInfo.url, '_blank');
        },
        () => {
            this.notify.error(this.ls.l('GenerationFailed'));
        });
    }

    ngOnDestroy() {
        this.leadInfoSubscription.unsubscribe();
    }
}