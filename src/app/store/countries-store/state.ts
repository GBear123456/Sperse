import { CountryDto } from 'shared/service-proxies/service-proxies';

export interface State {
    countries: CountryDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    countries: null,
    isLoading: false,
    error: null,
    loadedTime: null
};
