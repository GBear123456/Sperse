/** Core imports */
import { NgModule } from '@angular/core';

/** Third party imports */
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

/** Application imports */
import { CountriesStoreModule } from '@app/store/countries-store';

@NgModule({
    imports: [
        CountriesStoreModule,
        StoreModule.forRoot({}),
        EffectsModule.forRoot([]),
        StoreDevtoolsModule.instrument({ maxAge: 10 })
    ],
    declarations: []
})
export class AppStoreModule {}
