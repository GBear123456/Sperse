import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { LeadAssignedUsersStoreEffects } from 'app/store/assigned-users-store/lead-assigned-users-store/effects';
import { leadAssignedUsersReducer } from 'app/store/assigned-users-store/lead-assigned-users-store/reducer';
import { LeadServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('leadAssignedUsers', leadAssignedUsersReducer),
        EffectsModule.forFeature([LeadAssignedUsersStoreEffects])
    ],
    providers: [LeadAssignedUsersStoreEffects, LeadServiceProxy]
})
export class LeadAssignedUsersStoreModule {}
