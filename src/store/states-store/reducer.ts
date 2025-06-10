import { ActionTypes } from './actions';
import { State, initialState } from './state';
import { CountryStateDto } from '@shared/service-proxies/service-proxies';

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
        case ActionTypes.UPDATE: {
            if (!state.entities[action.payload.countryCode]) {
                state.entities[action.payload.countryCode] = {
                    items: [],
                    loadedTime: null
                };
            }
            const countryStates = state.entities[action.payload.countryCode].items;
            if (!action.payload.state.code || !countryStates.find((countryState: CountryStateDto) => countryState.code === action.payload.state.code)) {
                countryStates.push(action.payload.state);
            }
            return {
                ...state,
                entities: {
                    ...state.entities,
                    ...{ [action.payload.countryCode]: {
                        items: countryStates,
                        loadedTime: state.entities[action.payload.countryCode].loadedTime
                    }}
                }
            };
        }
        default: {
            return state;
        }
    }
}
