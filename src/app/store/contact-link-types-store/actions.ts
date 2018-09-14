import { Action } from '@ngrx/store';
import { ContactLinkTypeDto } from 'shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST                    = '[ContactLinkTypes] Load Request',
    LOAD_FAILURE                    = '[ContactLinkTypes] Load Failure',
    LOAD_SUCCESS                    = '[ContactLinkTypes] Load Success'
}

export class LoadRequestAction implements Action {
    readonly type = ActionTypes.LOAD_REQUEST;
    /** payload - yes if reload anyway, even if addressUsageTypes have already loaded */
    constructor(public payload: boolean = false) {}
}

export class LoadFailureAction implements Action {
    readonly type = ActionTypes.LOAD_FAILURE;
    constructor(public payload: string) {}
}

export class LoadSuccessAction implements Action {
    readonly type = ActionTypes.LOAD_SUCCESS;
    constructor(public payload: ContactLinkTypeDto[]) {}
}


export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction;

