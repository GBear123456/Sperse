import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';
import { ForecastModelDto } from '@shared/service-proxies/service-proxies';

export const getForecastModelsState = createFeatureSelector<State>('forecastModels');

export const getForecastModels = createSelector(
    getForecastModelsState,
    (state: State) => {
        return state && state.entities && state.entities.length
                ? state.entities.map((forecastModel: ForecastModelDto) => {
                    return {
                        ...forecastModel,
                        text: forecastModel.name
                    };
                })
                : null;
    }
);

export const getSelectedForecastModelId = createSelector(
    getForecastModelsState,
    getForecastModels,
    (state: State, forecastModels: Partial<ForecastModelDto>[], props) => state.selectedForecastModelId || (props && props.hasOwnProperty('defaultId') ? props.defaultValue : (forecastModels && forecastModels[0].id))
);

export const getSelectedForecastModelIndex = createSelector(
    getForecastModels,
    getSelectedForecastModelId,
    (forecastModels: Partial<ForecastModelDto>[], selectedForecastModelId: number) => {
        let result = null;
        if (forecastModels) {
            const index = forecastModels.findIndex((forecastModel: ForecastModelDto) => forecastModel.id === selectedForecastModelId);
            if (index > -1) {
                result = index;
            }
        }
        return result;
    }
);

export const getLoadedTime = createSelector(
    getForecastModelsState,
    (state: State) => state.loadedTime
);
