/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

/** Application imports */
import { StatesStoreActions, StatesStoreSelectors } from '../../../store/states-store';
import { CountryDto, CountryStateDto } from '../../service-proxies/service-proxies';
import { ICountryState } from './country-state.interface';
import { RootStore } from '../../../store';
import { CountriesStoreActions, CountriesStoreSelectors } from '@root/store/countries-store';
import { Country } from '@shared/AppEnums';

@Injectable()
export class FilterStatesService {
    countriesCodesThatHaveStates = [<string>Country.USA, <string>Country.Canada];
    constructor(private store$: Store<RootStore.State>) {}

    getCountries(selectedCountries?: string[], countriesToExpand?: string[]): Observable<ICountryState[]> {
        /** Load all countries */
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
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
                    selected: selectedCountries && selectedCountries.indexOf(country.code) >= 0,
                    expanded: countriesToExpand && countriesToExpand.indexOf(country.code) >= 0,
                    parentId: null
                }));
            })
        );
    }

    getStates(countryCode: string, selectedStates?: string[]): Observable<ICountryState[]> {
        this.store$.dispatch(new StatesStoreActions.LoadRequestAction(countryCode));
        return this.store$.pipe(
            select(StatesStoreSelectors.getCountryStates, { countryCode: countryCode }),
            filter(Boolean),
            first(),
            map((states: CountryStateDto[]) => {
                return states.map(((state: CountryStateDto) => ({
                    ...state,
                    code: countryCode + ':' + state.code,
                    hasItems: false,
                    selected: selectedStates && selectedStates.indexOf(state.code) >= 0,
                    parentId: countryCode,
                    expanded: false
                })));
            })
        );
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
}