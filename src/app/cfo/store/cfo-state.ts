import { CurrenciesStoreState } from 'app/cfo/store/index';
import { ForecastModelsStoreState } from 'app/cfo/store/index';

export interface State {
    currencies: CurrenciesStoreState.State;
    forecastModels: ForecastModelsStoreState.State;
}
