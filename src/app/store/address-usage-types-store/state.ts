import { AddressUsageTypeDto } from 'shared/service-proxies/service-proxies';

export interface State {
    addressUsageTypes: AddressUsageTypeDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    addressUsageTypes: null,
    isLoading: false,
    error: null,
    loadedTime: null
};
