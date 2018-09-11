import { Action } from '@ngrx/store';
import { ContactGroupListInfoDto, ContactGroupListInput } from 'shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST       = '[Lists] Load Request',
    LOAD_FAILURE       = '[Lists] Load Failure',
    LOAD_SUCCESS       = '[Lists] Load Success',
    ADD_LIST            = '[Lists] Add new list',
    ADD_LIST_SUCCESS    = '[Lists] Add list successfully',
    ADD_LIST_FAILUTE    = '[Lists] Add list with failure',
    RENAME_LIST         = '[Lists] Rename list',
    RENAME_LIST_SUCCESS = '[Lists] Rename list successfully',
    RENAME_LIST_FAILURE = '[Lists] Rename list failure',
    REMOVE_LIST         = '[Lists] Remove list',
    REMOVE_LIST_SUCCESS = '[Lists] Remove list success',
    REMOVE_LIST_FAILURE = '[Lists] Remove list failure'
}

export class LoadRequestAction implements Action {
    readonly type = ActionTypes.LOAD_REQUEST;
    constructor(public payload: boolean) {}
}

export class LoadFailureAction implements Action {
    readonly type = ActionTypes.LOAD_FAILURE;
    constructor(public payload: string) {}
}

export class LoadSuccessAction implements Action {
    readonly type = ActionTypes.LOAD_SUCCESS;
    constructor(public payload: ContactGroupListInfoDto[]) {}
}

export class AddList implements Action {
    readonly type = ActionTypes.ADD_LIST;
    constructor(public payload: {
        contactGroupIds: number[],
        lists: ContactGroupListInput[],
        successMessage: string,
        serviceMethodName: string
    }) {}
}

export class AddListSuccess implements Action {
    readonly type = ActionTypes.ADD_LIST_SUCCESS;
    constructor(public payload: {
        contactGroupIds: number[],
        lists: ContactGroupListInput[],
        successMessage: string,
        serviceMethodName: string
    }) {}
}

export class AddListFailure implements Action {
    readonly type = ActionTypes.ADD_LIST_FAILUTE;
    constructor(public payload: string) {}
}

export class RenameList implements Action {
    readonly type = ActionTypes.RENAME_LIST;
    constructor(public payload: {
        id: number;
        name: string;
    }) {}
}

export class RenameListSuccess implements Action {
    readonly type = ActionTypes.RENAME_LIST_SUCCESS;
    constructor(public payload: {
        id: number;
        name: string;
    }) {}
}

export class RenameListFailure implements Action {
    readonly type = ActionTypes.RENAME_LIST_FAILURE;
    constructor(public payload: string) {}
}

export class RemoveList implements Action {
    readonly type = ActionTypes.REMOVE_LIST;
    constructor(public payload: {
        id: number,
        moveToListId: number,
        deleteAllReferences: boolean
    }) {}
}

export class RemoveListSuccess implements Action {
    readonly type = ActionTypes.REMOVE_LIST_SUCCESS;
    constructor(public payload: {
        id: number,
        moveToListId: number,
        deleteAllReferences: boolean
    }) {}
}

export class RemoveListFailure implements Action {
    readonly type = ActionTypes.REMOVE_LIST_FAILURE;
    constructor(public payload: string) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction | AddList | AddListSuccess | AddListFailure | RenameList | RenameListSuccess | RenameListFailure | RemoveList | RemoveListSuccess | RemoveListFailure;
