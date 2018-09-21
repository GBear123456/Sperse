/** Core imports */
import { Component, OnInit, Injector, Input } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Store, select } from '@ngrx/store';
import * as _ from 'underscore';

/** Application imports */
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AppComponentBase } from 'shared/common/app-component-base';
import {
    BankCardInfoDto,
    CountryStateDto
} from '@shared/service-proxies/service-proxies';
import { until } from '@node_modules/@types/selenium-webdriver';
import Condition = until.Condition;
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';

@Component({
    selector: 'payment-info',
    templateUrl: './payment-info.component.html',
    styleUrls: ['./payment-info.component.less']
})
export class PaymentInfoComponent extends AppComponentBase implements OnInit {
    @Input() paymentAuthorizationRequired = true;

    private readonly INPUT_MASK = {
        creditCardNumber: '0000-0000-0000-0099',
        expirationDate: '00/0000',
        zipCode: '00000',
        cvvCode: '0009'
    };
    validationGroup: any;

    expirationDate: string;
    bankCard: BankCardInfoDto = BankCardInfoDto.fromJS({});
    states: CountryStateDto[];

    googleAutoComplete: Boolean;
    countryCode = 'US';
    conditions = ConditionsType;
    public options = {
        types: ['address'],
        componentRestrictions: {
            country: this.countryCode
        }
    };

    constructor(injector: Injector,
        private store$: Store<RootStore.State>,
        private dialog: MatDialog
    ) {
        super(injector);

        this.googleAutoComplete = Boolean(window['google']);
        this.getStates();
    }

    ngOnInit() { }

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
    }

    getStateCodeFromName(e) {
        let state = _.findWhere(this.states, { name: e });
        return (state && state.code) || null;
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

    focusInput(event) {
        if (!(event.component._value && event.component._value.trim())) {
            let input = event.event.target;
            event.component.option({
                mask: this.INPUT_MASK[input.name],
                maskRules: { 'D': /\d?/ },
                isValid: true
            });
            setTimeout(function () {
                if (input.createTextRange) {
                    let part = input.createTextRange();
                    part.move('character', 0);
                    part.select();
                } else if (input.setSelectionRange)
                    input.setSelectionRange(0, 0);

                input.focus();
            }, 100);
        }
    }

    blurInput(event) {
        if (!(event.component._value && event.component._value.trim()))
            event.component.option({ mask: '', value: '' });
    }

    openConditionsDialog(type: ConditionsType) {
        this.dialog.open(ConditionsModalComponent, { panelClass: 'slider', data: {type: type} });
    }
}
