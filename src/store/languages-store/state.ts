import { LanguageDto } from '@shared/service-proxies/service-proxies';

export interface State {
    languages: LanguageDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    languages: null,
    isLoading: false,
    error: null,
    loadedTime: null
};
