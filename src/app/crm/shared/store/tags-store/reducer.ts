import { ActionTypes } from './actions';
import { State, initialState } from './state';

export function tagsReducer(state: State = initialState, action) {
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
                tags: action.payload,
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
        // case ActionTypes.ADD_TAG_SUCCESS: {
        //     const stateTagsNames = state.tags.map(tag => tag.name);
        //     const assignedTagsNames = action.payload.tags.map(tag => tag.name);
        //     const newTags = assignedTagsNames.filter(assignedTagName => stateTagsNames.indexOf(assignedTagName) === -1);
        //     /** @todo chekc how to modify state with new tags */
        //     state.tags.concat(newTags);
        //     return {
        //         ...state,
        //         tags: [ ...state.tags ]
        //     };
        // }
        case ActionTypes.RENAME_TAG: {
            const tagId = action.payload.id;
            const newName = action.payload.name;
            const tag = state.tags.find(tag => tag.id === tagId);
            tag.name = newName;
            return {
                ...state,
                tags: [ ...state.tags ]
            };
        }
        case ActionTypes.REMOVE_TAG: {
            const tagId = action.payload.id;
            const tagIndex = state.tags.indexOf(state.tags.find(tag => tag.id === tagId));
            state.tags.splice(tagIndex, 1);
            return {
                ...state,
                tags: [ ...state.tags]
            };
        }
        default: {
            return state;
        }
    }
}
