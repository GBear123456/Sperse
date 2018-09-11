import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ContactLinkTypesStoreEffects } from '@app/crm/store/contact-link-types-store/effects';
import { contactLinkTypesReducer } from 'app/crm/store/contact-link-types-store/reducer';

@NgModule({
    imports: [
        StoreModule.forFeature('contactLinkTypes', contactLinkTypesReducer),
        EffectsModule.forFeature([ ContactLinkTypesStoreEffects ])
    ],
    providers: [ ContactLinkTypesStoreEffects ]
})
export class ContactLinkTypesStoreModule {}
