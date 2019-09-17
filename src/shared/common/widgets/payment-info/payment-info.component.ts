/** Core imports */
import { Component, OnInit, Injector, Input } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';

/** Application imports */
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AppComponentBase } from 'shared/common/app-component-base';
import {
    BankCardInfoDto,
    CountryStateDto
} from '@shared/service-proxies/service-proxies';
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { InputStatusesService } from '@shared/utils/input-statuses.service';
import { GooglePlaceHelper } from '@shared/helpers/GooglePlaceHelper';

@Component({
    selector: 'payment-info',
    templateUrl: './payment-info.component.html',
    styleUrls: ['./payment-info.component.less']
})
export class PaymentInfoComponent extends AppComponentBase implements OnInit {
    @Input() paymentAuthorizationRequired = true;

    validationGroup: any;
    expirationDate: string;
    bankCard: BankCardInfoDto = BankCardInfoDto.fromJS({});
    states: CountryStateDto[];
    googleAutoComplete: Boolean = Boolean(window['google']);
    countryCode = 'US';
    conditions = ConditionsType;
    public options = {
        types: ['address'],
        componentRestrictions: {
            country: this.countryCode
        }
    };

    constructor(
        injector: Injector,
        private store$: Store<RootStore.State>,
        private dialog: MatDialog,
        private googlePlaceHelper: GooglePlaceHelper,
        public inputStatusesService: InputStatusesService
    ) {
        super(injector);
    }

    ngOnInit() {
        this.getStates();
    }

    initValidationGroup(event) {
        this.validationGroup = event.component;
    }

    getStates(): void {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(this.countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: this.countryCode }))
            .subscribe(result => {
                if (result)
                    this.states = result;
            });
    }

    onAddressChanged(event) {
        let number = event.address_components[0]['long_name'];
        let street = event.address_components[1]['long_name'];

        this.bankCard.billingAddress = number ? (number + ' ' + street) : street;
        this.bankCard.billingStateCode = GooglePlaceHelper.getStateCode(event.address_components);
        this.bankCard.billingCity = this.googlePlaceHelper.getCity(event.address_components);
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
