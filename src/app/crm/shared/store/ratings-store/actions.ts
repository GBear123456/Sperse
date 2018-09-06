import { Action } from '@ngrx/store';

export enum ActionTypes {
    GET_ALL = '[Ratings] Get All',
}

export class GetAllAction implements Action {
    readonly type = ActionTypes.GET_ALL;
    constructor(public payload: boolean) {}
}

export type Actions = GetAllAction;
