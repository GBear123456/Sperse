import { Action } from '@ngrx/store';
import { CountryDto } from 'shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST       = '[Countries] Load Request',
    LOAD_FAILURE       = '[Countries] Load Failure',
    LOAD_SUCCESS       = '[Countries] Load Success'
}

export class LoadRequestAction implements Action {
    readonly type = ActionTypes.LOAD_REQUEST;
    /** payload - yes if reload anyway, even if countries have already loaded */
    constructor(public payload: boolean = false) {}
}

export class LoadFailureAction implements Action {
    readonly type = ActionTypes.LOAD_FAILURE;
    constructor(public payload: string) {}
}

export class LoadSuccessAction implements Action {
    readonly type = ActionTypes.LOAD_SUCCESS;
    constructor(public payload: CountryDto[]) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction;
