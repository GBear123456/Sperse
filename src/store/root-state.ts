import { CurrenciesStoreState } from './currencies-store';
import { StatesStoreState } from './states-store';
import { EmailUsageTypesStoreState } from './email-usage-types-store';
import { AddressUsageTypesStoreState } from './address-usage-types-store';
import { PhoneUsageTypesStoreState } from './phone-usage-types-store';
import { CountriesStoreState } from './countries-store';
import { LanguagesStoreState } from './languages-store';

export interface State {
    currencies: CurrenciesStoreState.State;
    states: StatesStoreState.State;
    emailUsageTypes: EmailUsageTypesStoreState.State;
    addressUsageTypes: AddressUsageTypesStoreState.State;
    phoneUsageTypes: PhoneUsageTypesStoreState.State;
    countries: CountriesStoreState.State;
    languages: LanguagesStoreState.State
}
