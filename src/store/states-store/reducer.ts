import { ActionTypes } from './actions';
import { State, initialState } from './state';

export function statesReducer(state: State = initialState, action): State {
    switch (action.type) {
        case ActionTypes.LOAD_SUCCESS: {
            return {
                ...state,
                entities: {
                    ...state.entities,
                    ...{ [action.payload.countryCode]: {
                        items: action.payload.states,
                        loadedTime: new Date().getTime()
                    }}
                }
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
