import { PartnerTypeDto } from 'shared/service-proxies/service-proxies';

export interface State {
    partnerTypes: PartnerTypeDto[];
    isLoading: boolean;
    error: string;
    loaded: boolean;
}

export const initialState: State = {
    partnerTypes: null,
    isLoading: false,
    error: null,
    loaded: false
};
