import { OrganizationTypeDto } from 'shared/service-proxies/service-proxies';

export interface State {
    organizationTypes: OrganizationTypeDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    organizationTypes: null,
    isLoading: false,
    error: null,
    loadedTime: null
};
