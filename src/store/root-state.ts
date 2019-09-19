import { CurrenciesStoreState } from './currencies-store';
import { StatesStoreState } from './states-store';

export interface State {
    currencies: CurrenciesStoreState.State;
    states: StatesStoreState.State;
}
