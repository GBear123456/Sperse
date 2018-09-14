import { Action } from '@ngrx/store';
import { UserInfoDto } from 'shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST       = '[Assigned Users] Load Request',
    LOAD_FAILURE       = '[Assigned Users] Load Failure',
    LOAD_SUCCESS       = '[Assigned Users] Load Success'
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
    constructor(public payload: UserInfoDto[]) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction;
