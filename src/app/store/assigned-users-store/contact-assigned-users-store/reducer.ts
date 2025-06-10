import { ActionTypes } from './actions';
import { State, initialState } from './state';

export function ContactAssignedUsersReducer(state: State = initialState, action) {
    switch (action.type) {
        case ActionTypes.LOAD_SUCCESS: {
            return {
                ...state,
                entities: {
                    ...state.entities,
                    ...{ [action.payload.contactGroup]: action.payload.users }
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