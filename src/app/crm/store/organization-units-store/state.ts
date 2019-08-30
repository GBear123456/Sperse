import { OrganizationUnitDto } from 'shared/service-proxies/service-proxies';

export interface State {
    items: OrganizationUnitDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    items: null,
    isLoading: false,
    error: null,
    loadedTime: null
};
