import { ActionTypes } from './actions';
import { State, initialState } from './state';

export function listsReducer(state: State = initialState, action) {
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
                lists: action.payload,
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
        case ActionTypes.RENAME_LIST: {
            const listId = action.payload.id;
            const newName = action.payload.name;
            const list = state.lists.find(list => list.id === listId);
            list.name = newName;
            return {
                ...state,
                lists: [ ...state.lists ]
            };
        }
        case ActionTypes.REMOVE_LIST: {
            const listId = action.payload.id;
            const listIndex = state.lists.indexOf(state.lists.find(list => list.id === listId));
            state.lists.splice(listIndex, 1);
            return {
                ...state,
                lists: [ ...state.lists]
            };
        }
        default: {
            return state;
        }
    }
}
