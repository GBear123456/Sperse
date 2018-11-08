import { ContactGroupStatusDto } from 'shared/service-proxies/service-proxies';

export interface State {
    statuses: ContactGroupStatusDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    statuses: null,
    isLoading: false,
    error: null,
    loadedTime: null
};
