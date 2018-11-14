import { ActionTypes } from './actions';
import { State, initialState } from './state';

export function countriesReducer(state: State = initialState, action) {
    switch (action.type) {
        case ActionTypes.LOAD_REQUEST: {
            const reload = action.payload;
            return {
                ...state,
                isLoading: true,
                error: null,
                loadedTime: reload ? null : state.loadedTime
            };
        }
        case ActionTypes.LOAD_SUCCESS: {
            return {
                ...state,
                countries: action.payload,
                isLoading: false,
                error: null,
                loadedTime: new Date().getTime()
            };
        }
        case ActionTypes.LOAD_FAILURE: {
            return {
                ...state,
                isLoading: false,
                error: action.payload
            };
        }
        default: {
            return state;
        }
    }
}
