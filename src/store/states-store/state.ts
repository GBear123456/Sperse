import { CountryStateDto } from 'shared/service-proxies/service-proxies';

export interface State {
    entities: { [id: number]: CountryStateDto[] };
    isLoading: boolean;
    error: string;
}

export const initialState: State = {
    entities: {},
    isLoading: false,
    error: null
};
