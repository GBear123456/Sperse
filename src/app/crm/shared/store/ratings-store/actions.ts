import { Action } from '@ngrx/store';
import { CustomerRatingInfoDto } from '@shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST       = '[Ratings] Load Request',
    LOAD_FAILURE       = '[Ratings] Load Failure',
    LOAD_SUCCESS       = '[Ratings] Load Success'
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
    constructor(public payload: CustomerRatingInfoDto[]) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction;
