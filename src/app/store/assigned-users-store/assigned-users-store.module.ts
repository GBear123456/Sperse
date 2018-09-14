import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { AssignedUsersStoreEffects } from 'app/store/assigned-users-store/effects';
import { assignedUsersReducer } from 'app/store/assigned-users-store/reducer';
import { UserAssignmentServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('assignedUsers', assignedUsersReducer),
        EffectsModule.forFeature([ AssignedUsersStoreEffects ])
    ],
    providers: [ AssignedUsersStoreEffects, UserAssignmentServiceProxy ]
})
export class AssignedUsersStoreModule {}
