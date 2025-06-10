import { Action } from '@ngrx/store';
import { ContactTagInfoDto, ContactTagInput } from 'shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST       = '[Tags] Load Request',
    LOAD_FAILURE       = '[Tags] Load Failure',
    LOAD_SUCCESS       = '[Tags] Load Success',
    ADD_TAG            = '[Tags] Add new tag',
    ADD_TAG_SUCCESS    = '[Tags] Add tag successfuly',
    ADD_TAG_FAILUTE    = '[Tags] Add tag with failure',
    RENAME_TAG         = '[Tags] Rename tag',
    RENAME_TAG_SUCCESS = '[Tags] Rename tag successfuly',
    RENAME_TAG_FAILURE = '[Tags] Rename tag fauilure',
    REMOVE_TAG         = '[Tags] Remove tag',
    REMOVE_TAG_SUCCESS = '[Tags] Remove tag success',
    REMOVE_TAG_FAILURE = '[Tags] Remove tag failure'
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
    constructor(public payload: ContactTagInfoDto[]) {}
}

export class AddTag implements Action {
    readonly type = ActionTypes.ADD_TAG;
    constructor(public payload: {
        contactIds: number[],
        tags: ContactTagInput[],
        successMessage: string,
        serviceMethodName: string
    }) {}
}

export class AddTagSuccess implements Action {
    readonly type = ActionTypes.ADD_TAG_SUCCESS;
    constructor(public payload: {
        contactIds: number[],
        tags: ContactTagInput[],
        successMessage: string,
        serviceMethodName: string
    }) {}
}

export class AddTagFailure implements Action {
    readonly type = ActionTypes.ADD_TAG_FAILUTE;
    constructor(public payload: string) {}
}

export class RenameTag implements Action {
    readonly type = ActionTypes.RENAME_TAG;
    constructor(public payload: {
        id: number;
        name: string;
    }) {}
}

export class RenameTagSuccess implements Action {
    readonly type = ActionTypes.RENAME_TAG_SUCCESS;
    constructor(public payload: {
        id: number;
        name: string;
    }) {}
}

export class RenameTagFailure implements Action {
    readonly type = ActionTypes.RENAME_TAG_FAILURE;
    constructor(public payload: string) {}
}

export class RemoveTag implements Action {
    readonly type = ActionTypes.REMOVE_TAG;
    constructor(public payload: {
        id: number,
        moveToTagId: number,
        deleteAllReferences: boolean
    }) {}
}

export class RemoveTagSuccess implements Action {
    readonly type = ActionTypes.REMOVE_TAG_SUCCESS;
    constructor(public payload: {
        id: number,
        moveToTagId: number,
        deleteAllReferences: boolean
    }) {}
}

export class RemoveTagFailure implements Action {
    readonly type = ActionTypes.REMOVE_TAG_FAILURE;
    constructor(public payload: string) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction | AddTag | AddTagSuccess | AddTagFailure | RenameTag | RenameTagSuccess | RenameTagFailure | RemoveTag | RemoveTagSuccess | RemoveTagFailure;
