import { CountryStateDto } from 'shared/service-proxies/service-proxies';

export interface StateEntity {
    items: CountryStateDto[];
    loadedTime: number;
}

export interface State {
    entities: { [id: string]: StateEntity };
    isLoading: boolean;
    error: string;
}

export const initialState: State = {
    entities: {},
    isLoading: false,
    error: null
};
