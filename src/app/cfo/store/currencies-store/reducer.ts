import { State, initialState } from './state';
import { ActionTypes } from '@app/cfo/store/currencies-store/actions';

export function currenciesReducer(state: State = initialState, action) {
    switch (action.type) {
        case ActionTypes.CHANGE_CURRENCY: {
            return {
                ...state,
                selectedCurrencyId: action.payload
            };
        }
    }

    return state;
}
