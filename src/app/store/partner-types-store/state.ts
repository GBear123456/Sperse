import { PartnerTypeDto } from 'shared/service-proxies/service-proxies';

export interface State {
    partnerTypes: PartnerTypeDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    partnerTypes: null,
    isLoading: false,
    error: null,
    loadedTime: null
};
