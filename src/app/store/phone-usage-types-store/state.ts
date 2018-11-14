import { PhoneUsageTypeDto } from 'shared/service-proxies/service-proxies';

export interface State {
    phoneUsageTypes: PhoneUsageTypeDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    phoneUsageTypes: null,
    isLoading: false,
    error: null,
    loadedTime: null
};
