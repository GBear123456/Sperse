import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { LanguagesStoreEffects } from '@root/store/languages-store/effects';
import { languagesReducer } from '@root/store/languages-store/reducer';
import { CountryServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('languages', languagesReducer),
        EffectsModule.forFeature([ LanguagesStoreEffects ])
    ],
    providers: [ LanguagesStoreEffects, CountryServiceProxy ]
})
export class LanguagesStoreModule {}
