import { Action } from '@ngrx/store';
import { PartnerTypeDto } from 'shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST       = '[Partner Types] Load Request',
    LOAD_FAILURE       = '[Partner Types] Load Failure',
    LOAD_SUCCESS       = '[Partner Types] Load Success',
    ADD_PARTNER_TYPE            = '[Partner Types] Add new partner type',
    ADD_PARTNER_TYPE_SUCCESS    = '[Partner Types] Add partner type successfuly',
    ADD_PARTNER_TYPE_FAILUTE    = '[Partner Types] Add partner type with failure',
    RENAME_PARTNER_TYPE         = '[Partner Types] Rename partner type',
    RENAME_PARTNER_TYPE_SUCCESS = '[Partner Types] Rename partner type successfuly',
    RENAME_PARTNER_TYPE_FAILURE = '[Partner Types] Rename partner type fauilure',
    REMOVE_PARTNER_TYPE         = '[Partner Types] Remove partner type',
    REMOVE_PARTNER_TYPE_SUCCESS = '[Partner Types] Remove partner type success',
    REMOVE_PARTNER_TYPE_FAILURE = '[Partner Types] Remove partner type failure'
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
    constructor(public payload: PartnerTypeDto[]) {}
}

export class AddPartnerType implements Action {
    readonly type = ActionTypes.ADD_PARTNER_TYPE;
    constructor(public payload: {
        partnerIds: number[],
        typeName: string,
        successMessage: string
    }) {}
}

export class AddPartnerTypeSuccess implements Action {
    readonly type = ActionTypes.ADD_PARTNER_TYPE_SUCCESS;
    constructor(public payload: {
        partnerIds: number[],
        typeName: string,
        successMessage: string
    }) {}
}

export class AddPartnerTypeFailure implements Action {
    readonly type = ActionTypes.ADD_PARTNER_TYPE_FAILUTE;
    constructor(public payload: string) {}
}

export class RenamePartnerType implements Action {
    readonly type = ActionTypes.RENAME_PARTNER_TYPE;
    constructor(public payload: {
        id: number;
        name: string;
    }) {}
}

export class RenamePartnerTypeSuccess implements Action {
    readonly type = ActionTypes.RENAME_PARTNER_TYPE_SUCCESS;
    constructor(public payload: {
        id: number;
        name: string;
    }) {}
}

export class RenamePartnerTypeFailure implements Action {
    readonly type = ActionTypes.RENAME_PARTNER_TYPE_FAILURE;
    constructor(public payload: string) {}
}

export class RemovePartnerType implements Action {
    readonly type = ActionTypes.REMOVE_PARTNER_TYPE;
    constructor(public payload: {
        id: number,
        moveToPartnerTypeId: number,
        deleteAllReferences: boolean
    }) {}
}

export class RemovePartnerTypeSuccess implements Action {
    readonly type = ActionTypes.REMOVE_PARTNER_TYPE_SUCCESS;
    constructor(public payload: {
        id: number,
        moveToPartnerTypeId: number,
        deleteAllReferences: boolean
    }) {}
}

export class RemovePartnerTypeFailure implements Action {
    readonly type = ActionTypes.REMOVE_PARTNER_TYPE_FAILURE;
    constructor(public payload: string) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction | AddPartnerType | AddPartnerTypeSuccess | AddPartnerTypeFailure | RenamePartnerType | RenamePartnerTypeSuccess | RenamePartnerTypeFailure | RemovePartnerType | RemovePartnerTypeSuccess | RemovePartnerTypeFailure;
