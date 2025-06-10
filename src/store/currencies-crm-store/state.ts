import { CurrencyDto } from '@shared/service-proxies/service-proxies';

export interface State {
    entities: CurrencyDto[];
    selectedCurrencyId: string;
    error: string;
    loading: boolean;
    loadedTime: number;
}

export const initialState: State = {
    entities: null,
    selectedCurrencyId: null,
    error: null,
    loading: false,
    loadedTime: null
};
