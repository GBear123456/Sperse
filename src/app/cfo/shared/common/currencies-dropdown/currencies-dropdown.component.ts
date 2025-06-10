/** Core imports */
import { Component, OnInit } from '@angular/core';

/** Third party imports  */
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';

/** Application imports */
import { RootStore, CurrenciesStoreActions, CurrenciesStoreSelectors } from '@root/store';
import { CurrencyInfo } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'currencies-dropdown',
    templateUrl: './currencies-dropdown.component.html',
    styleUrls: [
        '../../../../shared/common/styles/select-box.less',
        './currencies-dropdown.component.less'
    ]
})
export class CurrenciesDropdownComponent implements OnInit {
    public currencies$: Observable<Partial<CurrencyInfo>[]> = this.store$.pipe(select(CurrenciesStoreSelectors.getCurrencies));
    public selectedCurrencyId$: Observable<string> = this.store$.pipe(select(CurrenciesStoreSelectors.getSelectedCurrencyId));

    constructor(private store$: Store<RootStore.State>) { }

    ngOnInit() {
        this.store$.dispatch(new CurrenciesStoreActions.LoadRequestAction());
    }

    displayExpr(item) {
        return item ? item.symbol + ' ' + item.id : '';
    }

    changeOptionsPopupWidth(e) {
        e.component._popup.option('width', 200);
    }

    changeSelectedCurrency(e) {
        this.store$.dispatch(new CurrenciesStoreActions.ChangeCurrencyAction(e.value));
    }

}