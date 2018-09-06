import { ActionTypes } from './actions';
import { State, initialState } from './state';

export function pipelinesReducer(state: State = initialState, action) {
    switch (action.type) {
        case ActionTypes.LOAD_REQUEST: {
            const reload = action.payload;
            return {
                ...state,
                loading: true,
                error: null,
                loaded: reload ? false : state.loaded
            };
        }
        case ActionTypes.LOAD_SUCCESS: {
            return {
                ...state,
                pipelines: action.payload,
                loading: false,
                error: null,
                loaded: true
            };
        }
        case ActionTypes.LOAD_FAILURE: {
            return {
                ...state,
                loading: false,
                error: action.payload
            };
        }
        default: {
            return state;
        }
    }
}
