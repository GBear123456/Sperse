import { Injectable } from "@angular/core";

/** Third party imports */

import { FilterCheckBoxesComponent } from "@shared/filters/check-boxes/filter-check-boxes.component";
import { FilterModel } from "@shared/filters/models/filter.model";
import { FilterCheckBoxesModel } from "@shared/filters/check-boxes/filter-check-boxes.model";
import { select, Store } from "@ngrx/store";
import { FilterHelpers as CrmFilterHelpers } from '@app/crm/shared/helpers/filter.helper';
import { CurrenciesCrmStoreActions, CurrenciesCrmStoreSelectors, RootStore } from "..";
import { filter, tap } from "rxjs/operators";
import { Observable } from "rxjs";

/** Application imports */

@Injectable()
export class CurrencyCRMService {
    dataLoaded = false;

    constructor(
        private store$: Store<RootStore.State>
    ) {
        this.store$.dispatch(new CurrenciesCrmStoreActions.LoadRequestAction());
    }

    currencies$: Observable<any[]> = this.store$.pipe(
        select(CurrenciesCrmStoreSelectors.getCurrencies),
        filter(x => x != null),
        tap(data => {
            data.forEach(c => c['displayName'] = `${c.name}, ${c.symbol}`);
            this.dataLoaded = true;
            return data;
        })
    );

    getCurrencyFilter(initialCurrency, isClearAllowed = true, singleSelection = false): FilterModel {
        var filter = new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'Currency',
            hidden: false,
            field: 'CurrencyId',
            filterMethod: (filter) => CrmFilterHelpers.filterBySetOfValues(filter),
            items: {
                element: new FilterCheckBoxesModel({
                    value: [initialCurrency],
                    dataSource$: this.currencies$,
                    isClearAllowed: isClearAllowed,
                    nameField: 'text',
                    keyExpr: 'id',
                    singleSelection: singleSelection
                })
            }
        });

        if (!this.dataLoaded)
            setTimeout(() => filter.updateCaptions(), 1000);
        else
            filter.updateCaptions();

        return filter;
    }

    isSingleCurrencyFilterSelected(currencyFilter: FilterModel) {
        var values = currencyFilter.items.element.value;
        return values && values.length == 1;
    }

    getSelectedCurrencies(currencyFilter: FilterModel) {
        return currencyFilter.items.element.value;
    }
}
