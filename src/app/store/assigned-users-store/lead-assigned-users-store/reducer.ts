import { ActionTypes } from './actions';
import { State, initialState } from './state';

export function leadAssignedUsersReducer(state: State = initialState, action) {
    switch (action.type) {
        case ActionTypes.LOAD_REQUEST: {
            const reload = action.payload;
            return {
                ...state,
                isLoading: true,
                error: null,
                loaded: reload ? false : state.loaded
            };
        }
        case ActionTypes.LOAD_SUCCESS: {
            return {
                ...state,
                assignedUsers: action.payload,
                isLoading: false,
                error: null,
                loaded: true
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
