import { Injectable } from "@angular/core";

/** Third party imports */

import { FilterCheckBoxesComponent } from "@shared/filters/check-boxes/filter-check-boxes.component";
import { FilterItemModel } from "@shared/filters/models/filter-item.model";
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
            return data;
        })
    );

    getCurrencyFilter(initialCurrency): FilterModel {
        let itemModel = new FilterItemModel(initialCurrency);
        itemModel.isClearAllowed = false;

        return new FilterModel({
            component: FilterCheckBoxesComponent,
            caption: 'Currency',
            hidden: false,
            field: 'CurrencyId',
            filterMethod: (filter) => CrmFilterHelpers.filterBySetOfValues(filter),
            items: {
                element: new FilterCheckBoxesModel({
                    value: [initialCurrency],
                    dataSource$: this.currencies$,
                    nameField: 'text',
                    keyExpr: 'id'
                })
            }
        });
    }
}
