/** Core imports */
import { Component, ElementRef, Input, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Address } from 'ngx-google-places-autocomplete/objects/address';

/** Application imports */
import { RootStore, StatesStoreSelectors } from '@root/store';
import {
    BankCardInfoDto,
    CountryStateDto
} from '@shared/service-proxies/service-proxies';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { GooglePlaceService } from '@shared/common/google-place/google-place.service';
import { StatesService } from '@root/store/states-store/states.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
import { Country } from '@shared/AppEnums';

@Component({
    selector: 'payment-info',
    templateUrl: './payment-info.component.html',
    styleUrls: ['./payment-info.component.less']
})
export class PaymentInfoComponent {
    @Input() paymentAuthorizationRequired = true;
    @ViewChild('addressInput') addressInput: ElementRef;

    validationGroup: any;
    expirationDate: string;
    bankCard: BankCardInfoDto = BankCardInfoDto.fromJS({});
    states: CountryStateDto[];
    googleAutoComplete: Boolean = Boolean(window['google']);
    countryCode = AppConsts.defaultCountryCode;
    conditions = ConditionsType;
    public options = {
        types: ['address'],
        componentRestrictions: {
            country: [ Country.USA, Country.Canada ]
        }
    };

    constructor(
        private store$: Store<RootStore.State>,
        private dialog: MatDialog,
        private statesService: StatesService,
        public ls: AppLocalizationService,
        public inputStatusesService: InputStatusesService
    ) {}

    initValidationGroup(event) {
        this.validationGroup = event.component;
    }

    onAddressChanged(address: Address) {
        let number = GooglePlaceService.getStreetNumber(address.address_components);
        let street = GooglePlaceService.getStateName(address.address_components);
        this.bankCard.billingZip = GooglePlaceService.getZipCode(address.address_components);
        this.bankCard.billingAddress = this.addressInput.nativeElement.value = number ? (number + ' ' + street) : street;
        this.bankCard.billingCity = GooglePlaceService.getCity(address.address_components);
        this.bankCard.billingStateCode = GooglePlaceService.getStateCode(address.address_components);
        this.bankCard.billingState = GooglePlaceService.getStateName(address.address_components);
        this.bankCard.billingCountryCode = GooglePlaceService.getCountryCode(address.address_components);
        this.statesService.updateState(this.bankCard.billingCountryCode, this.bankCard.billingStateCode, this.bankCard.billingState);
    }

    getCountryStates(): Observable<CountryStateDto[]> {
        return this.store$.pipe(
            select(StatesStoreSelectors.getCountryStates, { countryCode: this.bankCard.billingCountryCode })
        );
    }

    onCustomStateCreate(e) {
        this.bankCard.billingStateCode = null;
        this.bankCard.billingState = e.text;
        this.statesService.updateState(this.bankCard.billingCountryCode, null, e.text);
        e.customItem = {
            code: null,
            name: e.text
        };
    }

    validateExpirationDate = (options) => {
        let year = parseInt(options.value.substring(2, 6)),
            month = parseInt(options.value.substring(0, 2));

        let isValid = (month < 13) && (year < ((new Date()).getFullYear() + 10))
            && (new Date(year, month)).getTime() > Date.now();

        if (isValid) {
            this.bankCard.expirationMonth = month.toString();
            this.bankCard.expirationYear = year.toString();
        } else {
            this.bankCard.expirationMonth = null;
            this.bankCard.expirationYear = null;
        }

        return isValid;
    }

    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: {type: type} });
    }
}
