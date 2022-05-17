/** Core imports */
import {
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    Component, ElementRef,
    EventEmitter,
    Input,
    Output,
    ViewChild,
    OnInit
} from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { Address as AutocompleteAddress} from 'ngx-google-places-autocomplete/objects/address';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    AddressUsageTypeDto,
    CountryDto,
    CountryStateDto
} from '@shared/service-proxies/service-proxies';
import {
    CountriesStoreActions,
    CountriesStoreSelectors,
    RootStore, StatesStoreActions,
    StatesStoreSelectors
} from '@root/store';
import { AddressChanged } from '@shared/common/create-entity-dialog/address-fields/address-changed.interface';
import { Address } from '@shared/common/create-entity-dialog/models/address.model';

@Component({
    selector: 'address-fields',
    templateUrl: 'address-fields.component.html',
    styleUrls: [ 'address-fields.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressFieldsComponent implements OnInit {
    @Input() address: Address;
    @Input() addressTypes?: AddressUsageTypeDto[];
    @Input() googleAutoComplete: boolean;
    @Input() showClearButton: boolean;
    @Input() showNeighborhood: boolean;
    @Output() onAddressTypeChanged: EventEmitter<any> = new EventEmitter<any>();
    @Output() onCountryUpdate: EventEmitter<any> = new EventEmitter<string>();
    @Output() onAddressChanged: EventEmitter<AddressChanged> = new EventEmitter<AddressChanged>();
    @Output() onCustomStateCreated: EventEmitter<string> = new EventEmitter<string>();
    @Output() onAddressRemove: EventEmitter<any> = new EventEmitter<string>();
    @Output() onCountryChanged: EventEmitter<any> = new EventEmitter<string>();
    @Output() onCityChanged: EventEmitter<any> = new EventEmitter<string>();
    @Output() onStateChanged: EventEmitter<any> = new EventEmitter<string>();
    @Output() onZipChanged: EventEmitter<any> = new EventEmitter<string>();
    @ViewChild('addressInput') addressInput: ElementRef;
    countries$: Observable<CountryDto[]> = this.store$.pipe(select(CountriesStoreSelectors.getCountries));

    constructor(
        private store$: Store<RootStore.State>,
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.countriesStateLoad();
    }

    countriesStateLoad(): void {
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
    }

    addressTypeChanged(e) {
        this.onAddressTypeChanged.emit(e);
    }

    updateCountry(countryName: string) {
        this.onCountryUpdate.emit(countryName);
    }

    getCountryStates(countryCode: string): Observable<CountryStateDto[]> {
        return this.store$.pipe(
            select(StatesStoreSelectors.getCountryStates, { countryCode: countryCode })
        );
    }

    changeAddress(address: AutocompleteAddress) {
        this.onAddressChanged.emit({
            address: address,
            addressInput: this.addressInput
        });
    }

    createCustomState(e) {
        this.onCustomStateCreated.emit(e);
    }

    removeAddress() {
        this.onAddressRemove.emit();
    }

    changeCountry(e) {
        this.onCountryChanged.emit(e);
        if (e.value) {
            this.store$.dispatch(new StatesStoreActions.LoadRequestAction(e.value));
        }
    }

    changeCity() {
        this.onCityChanged.emit();
    }

    changeZip() {
        this.onZipChanged.emit();
    }

    changeState(e) {
        this.address.state.code = e.value;
        this.onStateChanged.emit();
    }
}