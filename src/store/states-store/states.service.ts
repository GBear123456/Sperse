import { Injectable } from '@angular/core';
import { RootStore, StatesStoreActions } from '@root/store';
import { CountryStateDto } from '@shared/service-proxies/service-proxies';
import { Store } from '@ngrx/store';

@Injectable()
export class StatesService {

    constructor(private store$: Store<RootStore.State>) {}

    updateState(countryCode: string, stateCode: string, stateName: string) {
        if (stateCode || stateName) {
            this.store$.dispatch(new StatesStoreActions.UpdateAction({
                countryCode: countryCode,
                state: new CountryStateDto({
                    code: stateCode,
                    name: stateName
                })
            }));
        }
    }

    getAdjustedStateCode(stateCode: string, stateName): string {
        return stateCode && stateCode.length <= 3 && stateCode !== stateName ? stateCode : null;
    }

}
