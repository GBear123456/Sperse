import { ForecastModelDto } from '@shared/service-proxies/service-proxies';

export interface State {
    entities: ForecastModelDto[];
    selectedForecastModelId: number;
    error: string;
    loading: boolean;
    loadedTime: number;
}

export const initialState: State = {
    entities: null,
    selectedForecastModelId: null,
    error: null,
    loading: false,
    loadedTime: null
};
