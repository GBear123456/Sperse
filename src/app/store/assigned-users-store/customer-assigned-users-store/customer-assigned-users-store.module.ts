import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { CustomerAssignedUsersStoreEffects } from 'app/store/assigned-users-store/customer-assigned-users-store/effects';
import { customerAssignedUsersReducer } from 'app/store/assigned-users-store/customer-assigned-users-store/reducer';
import { CustomerServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('customerAssignedUsers', customerAssignedUsersReducer),
        EffectsModule.forFeature([CustomerAssignedUsersStoreEffects])
    ],
    providers: [CustomerAssignedUsersStoreEffects, CustomerServiceProxy]
})
export class CustomerAssignedUsersStoreModule {}
