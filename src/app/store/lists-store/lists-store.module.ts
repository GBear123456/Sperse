import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ListsStoreEffects } from 'app/store/lists-store/effects';
import { listsReducer } from 'app/store/lists-store/reducer';
import { ContactGroupListsServiceProxy, DictionaryServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('lists', listsReducer),
        EffectsModule.forFeature([ ListsStoreEffects ])
    ],
    providers: [ListsStoreEffects, ContactGroupListsServiceProxy, DictionaryServiceProxy ]
})
export class ListsStoreModule {}
