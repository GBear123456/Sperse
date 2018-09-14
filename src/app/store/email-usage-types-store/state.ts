import { EmailUsageTypeDto } from 'shared/service-proxies/service-proxies';

export interface State {
    emailUsageTypes: EmailUsageTypeDto[];
    isLoading: boolean;
    error: string;
    loaded: boolean;
}

export const initialState: State = {
    emailUsageTypes: null,
    isLoading: false,
    error: null,
    loaded: false
};
