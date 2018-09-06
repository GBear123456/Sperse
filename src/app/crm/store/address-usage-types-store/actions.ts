import { Action } from '@ngrx/store';
import { AddressUsageTypeDto } from 'shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST       = '[AddressUsageTypes] Load Request',
    LOAD_FAILURE       = '[AddressUsageTypes] Load Failure',
    LOAD_SUCCESS       = '[AddressUsageTypes] Load Success'
}

export class LoadRequestAction implements Action {
    readonly type = ActionTypes.LOAD_REQUEST;
    /** payload - yes if reload anyway, even if addressUsageTypes have already loaded */
    constructor(public payload: boolean = false) {}
}

export class LoadFailureAction implements Action {
    readonly type = ActionTypes.LOAD_FAILURE;
    constructor(public payload: string) {}
}

export class LoadSuccessAction implements Action {
    readonly type = ActionTypes.LOAD_SUCCESS;
    constructor(public payload: AddressUsageTypeDto[]) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction;
