import { Action } from '@ngrx/store';
import { EmailUsageTypeDto } from 'shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST                    = '[EmailUsageTypes] Load Request',
    LOAD_FAILURE                    = '[EmailUsageTypes] Load Failure',
    LOAD_SUCCESS                    = '[EmailUsageTypes] Load Success'
}

export class LoadRequestAction implements Action {
    readonly type = ActionTypes.LOAD_REQUEST;
    /** payload - yes if reload anyway, even if emailUsageTypes have already loaded */
    constructor(public payload: boolean = false) {}
}

export class LoadFailureAction implements Action {
    readonly type = ActionTypes.LOAD_FAILURE;
    constructor(public payload: string) {}
}

export class LoadSuccessAction implements Action {
    readonly type = ActionTypes.LOAD_SUCCESS;
    constructor(public payload: EmailUsageTypeDto[]) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction;

