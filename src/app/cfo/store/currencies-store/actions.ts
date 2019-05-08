import { Action } from '@ngrx/store';

export enum ActionTypes {
    GET_ALL = '[Currencies] Get All',
    CHANGE_CURRENCY = '[Currencies] Change Currency'
}

export class GetAllAction implements Action {
    readonly type = ActionTypes.GET_ALL;
    constructor(public payload: boolean) {}
}

export class ChangeCurrencyAction implements Action {
    readonly type = ActionTypes.CHANGE_CURRENCY;
    constructor(public payload: string) {}
}

export type Actions = GetAllAction | ChangeCurrencyAction;

