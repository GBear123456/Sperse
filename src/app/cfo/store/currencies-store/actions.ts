import { Action } from '@ngrx/store';
import { CurrencyInfo } from '@shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST    = '[Currencies] Load Request',
    LOAD_FAILURE    = '[Currencies] Load Failure',
    LOAD_SUCCESS    = '[Currencies] Load Success',
    CHANGE_CURRENCY = '[Currencies] Change Currency'
}

export class LoadRequestAction implements Action {
    readonly type = ActionTypes.LOAD_REQUEST;
    constructor() {}
}

export class LoadFailureAction implements Action {
    readonly type = ActionTypes.LOAD_FAILURE;
    constructor(public payload: string) {}
}

export class LoadSuccessAction implements Action {
    readonly type = ActionTypes.LOAD_SUCCESS;
    constructor(public payload: CurrencyInfo[]) {}
}

export class ChangeCurrencyAction implements Action {
    readonly type = ActionTypes.CHANGE_CURRENCY;
    constructor(public payload: string) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction | ChangeCurrencyAction;

