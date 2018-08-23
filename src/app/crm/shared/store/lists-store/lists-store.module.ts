import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ListsStoreEffects } from '@app/crm/shared/store/lists-store/effects';
import { listsReducer } from '@app/crm/shared/store/lists-store/reducer';
import { CustomerListsServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('lists', listsReducer),
        EffectsModule.forFeature([ ListsStoreEffects ])
    ],
    providers: [ ListsStoreEffects, CustomerListsServiceProxy ]
})
export class ListsStoreModule {}
