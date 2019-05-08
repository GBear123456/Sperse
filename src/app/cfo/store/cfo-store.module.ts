/** Core imports */
import { NgModule } from '@angular/core';

/** Application imports */
import { CurrenciesStoreModule } from '@app/cfo/store/currencies-store';

@NgModule({
    imports: [
        CurrenciesStoreModule
    ],
    declarations: []
})
export class CfoStoreModule {}
