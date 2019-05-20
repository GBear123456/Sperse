import { State, initialState } from './state';
import { ActionTypes } from '@app/cfo/store/forecast-models-store/actions';

export function forecastModelsReducer(state: State = initialState, action) {
    switch (action.type) {
        case ActionTypes.LOAD_REQUEST: {
            const reload = action.payload;
            return {
                ...state,
                loading: true,
                error: null,
                loadedTime: reload ? null : state.loadedTime
            };
        }
        case ActionTypes.LOAD_SUCCESS: {
            return {
                ...state,
                entities: action.payload,
                loading: false,
                error: null,
                loadedTime: new Date().getTime()
            };
        }
        case ActionTypes.LOAD_FAILURE: {
            return {
                ...state,
                loading: false,
                error: action.payload
            };
        }
        case ActionTypes.CHANGE_FORECAST_MODEL: {
            return {
                ...state,
                selectedForecastModelId: action.payload
            };
        }
        case ActionTypes.ADD_FORECAST_MODEL_SUCCESS: {
            return {
                ...state,
                entities: [ ...state.entities, action.payload ]
            };
        }
        case ActionTypes.RENAME_FORECAST_MODEL_SUCCESS: {
            const entities = state.entities;
            const entityForRenameIndex = entities.findIndex(entity => entity.id === action.payload.id);
            entities[entityForRenameIndex].name = action.payload.newName;
            return {
                ...state,
                entities: entities
            };
        }
        default: {
            return state;
        }
    }
}
