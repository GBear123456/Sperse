import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TagsStoreEffects } from '@app/crm/shared/store/tags-store/effects';
import { tagsReducer } from '@app/crm/shared/store/tags-store/reducer';
import { CustomerTagsServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('tags', tagsReducer),
        EffectsModule.forFeature([ TagsStoreEffects ])
    ],
    providers: [ TagsStoreEffects, CustomerTagsServiceProxy ]
})
export class TagsStoreModule {}
