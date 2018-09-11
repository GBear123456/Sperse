import { Action } from '@ngrx/store';
import { ContactGroupStarInfoDto } from 'shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST       = '[Stars] Load Request',
    LOAD_FAILURE       = '[Stars] Load Failure',
    LOAD_SUCCESS       = '[Stars] Load Success'
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
    constructor(public payload: ContactGroupStarInfoDto[]) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction;
