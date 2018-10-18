import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ActivityAssignedUsersStoreEffects } from 'app/store/assigned-users-store/activity-assigned-users-store/effects';
import { activityAssignedUsersReducer } from 'app/store/assigned-users-store/activity-assigned-users-store/reducer';
import { UserAssignmentServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('activityAssignedUsers', activityAssignedUsersReducer),
        EffectsModule.forFeature([ActivityAssignedUsersStoreEffects])
    ],
    providers: [ActivityAssignedUsersStoreEffects, UserAssignmentServiceProxy]
})
export class ActivityAssignedUsersStoreModule {}

