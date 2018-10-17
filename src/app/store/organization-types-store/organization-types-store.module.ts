import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { OrganizationTypeEffects } from 'app/store/organization-types-store/effects';
import { organizationTypeReducer } from 'app/store/organization-types-store/reducer';
import { OrganizationTypeServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        StoreModule.forFeature('OrganizationTypes', organizationTypeReducer),
        EffectsModule.forFeature([OrganizationTypeEffects ])
    ],
    providers: [OrganizationTypeEffects, OrganizationTypeServiceProxy ]
})
export class OrganizationTypeStoreModule {}
