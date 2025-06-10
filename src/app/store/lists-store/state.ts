import { ContactListInfoDto } from 'shared/service-proxies/service-proxies';

export interface State {
    lists: ContactListInfoDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    lists: null,
    isLoading: false,
    error: null,
    loadedTime: null
};
