import { Action } from '@ngrx/store';
import {
    CreateForecastModelInput,
    ForecastModelDto,
    RenameForecastModelInput
} from '@shared/service-proxies/service-proxies';

export enum ActionTypes {
    LOAD_REQUEST                    = '[Forecast Models] Load Request',
    LOAD_FAILURE                    = '[Forecast Models] Load Failure',
    LOAD_SUCCESS                    = '[Forecast Models] Load Success',
    CHANGE_FORECAST_MODEL           = '[Forecast Models] Change Forecast Model',
    ADD_FORECAST_MODEL              = '[Forecast Models] Add Forecast Model',
    ADD_FORECAST_MODEL_SUCCESS      = '[Forecast Models] Add Forecast Model Success',
    RENAME_FORECAST_MODEL           = '[Forecast Models] Rename Forecast Model',
    RENAME_FORECAST_MODEL_SUCCESS   = '[Forecast Models] Rename Forecast Model Success'
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
    constructor(public payload: ForecastModelDto[]) {}
}

export class ChangeForecastModelAction implements Action {
    readonly type = ActionTypes.CHANGE_FORECAST_MODEL;
    constructor(public payload: number) {}
}

export class AddForecastModelAction implements Action {
    readonly type = ActionTypes.ADD_FORECAST_MODEL;
    constructor(public payload: CreateForecastModelInput) {}
}

export class AddForecastModelSuccessAction implements Action {
    readonly type = ActionTypes.ADD_FORECAST_MODEL_SUCCESS;
    constructor(public payload: Partial<CreateForecastModelInput>) {}
}

export class RenameForecastModelAction implements Action {
    readonly type = ActionTypes.RENAME_FORECAST_MODEL;
    constructor(public payload: RenameForecastModelInput) {}
}

export class RenameForecastModelSuccessAction implements Action {
    readonly type = ActionTypes.RENAME_FORECAST_MODEL_SUCCESS;
    constructor(public payload: RenameForecastModelInput) {}
}

export type Actions = LoadRequestAction | LoadFailureAction | LoadSuccessAction | ChangeForecastModelAction | AddForecastModelAction | AddForecastModelSuccessAction | RenameForecastModelAction;

