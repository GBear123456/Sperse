import { EmailUsageTypeDto } from 'shared/service-proxies/service-proxies';

export interface State {
    emailUsageTypes: EmailUsageTypeDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    emailUsageTypes: null,
    isLoading: false,
    error: null,
    loadedTime: null
};
