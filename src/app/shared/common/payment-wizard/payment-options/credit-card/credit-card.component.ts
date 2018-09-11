/** Core imports */
import { Component, OnInit, Injector, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, NgForm } from '@angular/forms';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { CreditCardValidator } from 'ngx-credit-cards';

/** Application imports */
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CountryStateDto, CountryServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'credit-card',
    templateUrl: './credit-card.component.html',
    styleUrls: ['./credit-card.component.less'],
    providers: [ CountryServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditCardComponent extends AppComponentBase implements OnInit {
    countryCode = 'US';
    countries = [];
    states: CountryStateDto[];
    address = {
        state: null,
        country: null,
        address: null
    };

    creditCardData = this.formBuilder.group({
        cardNumber: ['', [CreditCardValidator.validateCardNumber]],
        cardExpDate: ['', [CreditCardValidator.validateCardExpiry]],
        cvvCode: ['', [CreditCardValidator.validateCardCvc]],
        cardHolderName: [''],
        address: [''],
        city: [''],
        stateOrProvince: [{value: '', disabled: true}],
        zipCode: [''],
        country: [''],
    });

    constructor(
        injector: Injector,
        private formBuilder: FormBuilder,
        private _countryService: CountryServiceProxy,
        private store$: Store<RootStore.State>
    ) {
        super(injector);
        this.getStates();
        this.getCountries();
    }

    ngOnInit() {
        //console.log(this.creditCardForm);
    }

    onSubmit(formData: NgForm) {
        console.log('Submitted');
        console.log(this.creditCardData);
    }

    getStates(): void {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(this.countryCode));
        this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: this.countryCode }))
            .subscribe(result => {
                this.states = result;
            });
    }

    getCountries(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
        this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe(result => {
            this.countries = result;
        });
    }

    onCountryChange(event) {
        let countryCode = event.value;
        if (countryCode) {
            this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
            this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: countryCode }))
                .subscribe(result => {
                    this.states = result;
                    if (!this.states.length) {
                        this.creditCardData.get('stateOrProvince').disable();
                    } else {
                        this.creditCardData.get('stateOrProvince').enable();
                    }
                });
        }
    }
}
