import { Action } from '@ngrx/store';
import { MemberServiceDto } from '@shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST       = '[Subscriptions] Load Request',
    LOAD_FAILURE       = '[Subscriptions] Load Failure',
    LOAD_SUCCESS       = '[Subscriptions] Load Success'
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
    constructor(public payload: MemberServiceDto[]) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction;
