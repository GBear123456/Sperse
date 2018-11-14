import { ContactStatusDto } from 'shared/service-proxies/service-proxies';

export interface State {
    statuses: ContactStatusDto[];
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
