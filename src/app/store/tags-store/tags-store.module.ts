import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TagsStoreEffects } from 'app/store/tags-store/effects';
import { tagsReducer } from 'app/store/tags-store/reducer';
import { ContactTagsServiceProxy, DictionaryServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('tags', tagsReducer),
        EffectsModule.forFeature([ TagsStoreEffects ])
    ],
    providers: [TagsStoreEffects, ContactTagsServiceProxy, DictionaryServiceProxy ]
})
export class TagsStoreModule {}
