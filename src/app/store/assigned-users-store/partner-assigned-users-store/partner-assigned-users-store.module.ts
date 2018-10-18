import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { PartnerAssignedUsersStoreEffects } from 'app/store/assigned-users-store/partner-assigned-users-store/effects';
import { partnerAssignedUsersReducer } from 'app/store/assigned-users-store/partner-assigned-users-store/reducer';
import { UserAssignmentServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('partnerAssignedUsers', partnerAssignedUsersReducer),
        EffectsModule.forFeature([PartnerAssignedUsersStoreEffects])
    ],
    providers: [PartnerAssignedUsersStoreEffects, UserAssignmentServiceProxy]
})
export class PartnerAssignedUsersStoreModule {}
