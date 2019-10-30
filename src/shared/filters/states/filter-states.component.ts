/** Core imports */
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, filter, map } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';

/** Application imports */
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { FilterComponent } from '../models/filter-component';
import { FilterStatesModel } from './filter-states.model';
import { CountryDto, CountryStateDto, ICountryStateDto } from '@shared/service-proxies/service-proxies';

interface ICountryState extends ICountryStateDto {
    hasItems: boolean;
    parentId: string;
    selected: boolean;
    expanded: boolean;
}

@Component({
    templateUrl: './filter-states.component.html',
    styleUrls: ['./filter-states.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterStatesComponent implements FilterComponent, OnInit {
    items: {
        countryStates: FilterStatesModel
    };
    component: any;
    apply: (event) => void;
    selectedCountries: string[] = [];
    countriesToExpand: string[] = [];
    selectedStates: string[] = [];
    countriesCodesThatHaveStates = ['US', 'CA'];

    constructor(
        private cacheService: CacheService,
        private store$: Store<RootStore.State>
    ) {}

    ngOnInit() {
        if (this.items.countryStates.value && this.items.countryStates.value.length) {
            this.items.countryStates.value.forEach((countryState: string) => {
                const [ countryCode, stateCode ] = countryState.split(':');
                if (stateCode) {
                    this.selectedStates.push(stateCode);
                    this.countriesToExpand.push(countryCode);
                } else {
                    this.selectedCountries.push(countryCode);
                }
            });
        }
        /** Load all countries */
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
    }

    /**
     * Returns items for expanded node, but also returns items for root
     * @param node
     * @return {Promise<ICountryState[]>}
     */
    createChildren = (node) => {
        if (!node) {
            /** Return list of countries */
            return this.getCountries().toPromise();
        } else {
            this.store$.dispatch(new StatesStoreActions.LoadRequestAction(node.key));
            /** Return states of specific country */
            return this.getStates(node.key).toPromise();
        }
    }

    /**
     * Move countries that have states to the top
     * @param {CountryDto[]} countries
     * @return {CountryDto[]}
     */
    private sortCountries(countries: CountryDto[]): CountryDto[] {
        const countriesThatHaveStates: CountryDto[] = [];
        this.countriesCodesThatHaveStates.forEach((countryCode: string) => {
            const countryIndex = countries.findIndex((country: CountryDto) => {
                return country.code === countryCode;
            });
            countriesThatHaveStates.push(countries.splice(countryIndex, 1)[0]);
        });
        countries.unshift(...countriesThatHaveStates);
        return countries;
    }

    private getCountries(): Observable<ICountryState[]> {
        return this.store$.pipe(
            select(CountriesStoreSelectors.getCountries),
            filter(Boolean),
            first()
        ).pipe(
            map((countries: CountryDto[]) => {
                countries = this.sortCountries(countries);
                return countries.map((country: CountryDto) => ({
                    ...country,
                    hasItems: this.countriesCodesThatHaveStates.indexOf(country.code) >= 0,
                    selected: this.selectedCountries.indexOf(country.code) >= 0,
                    expanded: this.countriesToExpand.indexOf(country.code) >= 0,
                    parentId: null
                }));
            })
        );
    }

    private getStates(countryCode: string): Observable<ICountryState[]> {
        return this.store$.pipe(
            select(StatesStoreSelectors.getState, { countryCode: countryCode }),
            filter(Boolean),
            first(),
            map((states: CountryStateDto[]) => {
                return states.map(((state: CountryStateDto) => ({
                    ...state,
                    code: countryCode + ':' + state.code,
                    hasItems: false,
                    selected: this.selectedStates.indexOf(state.code) >= 0,
                    parentId: countryCode,
                    expanded: false
                })));
            })
        );
    }

    onSelect($event) {
        this.items.countryStates.value = $event.component.getSelectedNodesKeys();
        this.items.countryStates.list = $event.component.getNodes();
    }

}
