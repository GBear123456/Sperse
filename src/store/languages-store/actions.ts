import { Action } from '@ngrx/store';
import { LanguageDto } from '@shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST       = '[Languages] Load Request',
    LOAD_FAILURE       = '[Languages] Load Failure',
    LOAD_SUCCESS       = '[Languages] Load Success'
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
    constructor(public payload: LanguageDto[]) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction;
