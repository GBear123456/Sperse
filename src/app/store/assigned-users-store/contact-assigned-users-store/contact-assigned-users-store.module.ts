import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ContactAssignedUsersStoreEffects } from './effects';
import { ContactAssignedUsersReducer } from './reducer';
import { ContactServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('ContactAssignedUsers', ContactAssignedUsersReducer),
        EffectsModule.forFeature([ContactAssignedUsersStoreEffects])
    ],
    providers: [ContactAssignedUsersStoreEffects, ContactServiceProxy]
})
export class ContactAssignedUsersStoreModule {}
