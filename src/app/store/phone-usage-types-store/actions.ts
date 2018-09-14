import { Action } from '@ngrx/store';
import { PhoneUsageTypeDto } from 'shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST                    = '[PhoneUsageTypes] Load Request',
    LOAD_FAILURE                    = '[PhoneUsageTypes] Load Failure',
    LOAD_SUCCESS                    = '[PhoneUsageTypes] Load Success'
}

export class LoadRequestAction implements Action {
    readonly type = ActionTypes.LOAD_REQUEST;
    /** payload - yes if reload anyway, even if phoneUsageTypes have already loaded */
    constructor(public payload: boolean = false) {}
}

export class LoadFailureAction implements Action {
    readonly type = ActionTypes.LOAD_FAILURE;
    constructor(public payload: string) {}
}

export class LoadSuccessAction implements Action {
    readonly type = ActionTypes.LOAD_SUCCESS;
    constructor(public payload: PhoneUsageTypeDto[]) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction;

