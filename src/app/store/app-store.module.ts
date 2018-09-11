/** Core imports */
import { NgModule } from '@angular/core';

/** Application imports */
import { CountriesStoreModule } from '@app/store/countries-store';

@NgModule({
    imports: [
        CountriesStoreModule
    ],
    declarations: []
})
export class AppStoreModule {}
