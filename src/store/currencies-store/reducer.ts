import { State, initialState } from './state';
import { ActionTypes } from './actions';

export function currenciesReducer(state: State = initialState, action) {
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
        case ActionTypes.CHANGE_CURRENCY: {
            return {
                ...state,
                selectedCurrencyId: action.payload
            };
        }
        default: {
            return state;
        }
    }
}
