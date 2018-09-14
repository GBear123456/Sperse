import { AddressUsageTypeDto } from 'shared/service-proxies/service-proxies';

export interface State {
    addressUsageTypes: AddressUsageTypeDto[];
    isLoading: boolean;
    error: string;
    loaded: boolean;
}

export const initialState: State = {
    addressUsageTypes: null,
    isLoading: false,
    error: null,
    loaded: false
};
