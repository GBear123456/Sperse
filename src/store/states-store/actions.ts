import { Action } from '@ngrx/store';
import { CountryStateDto } from 'shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST       = '[States] Load Request',
    LOAD_FAILURE       = '[States] Load Failure',
    LOAD_SUCCESS       = '[States] Load Success',
    UPDATE             = '[States] Update',
}

export class LoadRequestAction implements Action {
    readonly type = ActionTypes.LOAD_REQUEST;
    constructor(public payload: string) {}
}

export class LoadFailureAction implements Action {
    readonly type = ActionTypes.LOAD_FAILURE;
    constructor(public payload: string) {}
}

export class LoadSuccessAction implements Action {
    readonly type = ActionTypes.LOAD_SUCCESS;
    constructor(public payload: {
        countryCode: string,
        states: CountryStateDto[]
    }) {}
}

export class UpdateAction implements Action {
    readonly type = ActionTypes.UPDATE;
    constructor(public payload: {
        countryCode: string,
        state: CountryStateDto
    }) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction | UpdateAction;
