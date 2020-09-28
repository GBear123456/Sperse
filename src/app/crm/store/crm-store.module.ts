/** Core imports */
import { NgModule } from '@angular/core';

/** Application imports */
import { PipelinesStoreModule } from '@app/crm/store/pipelines-store';
import { OrganizationUnitsStoreModule } from '@app/crm/store/organization-units-store';
import { SubscriptionsStoreModule } from '@app/crm/store/subscriptions';
import { ServiceProductServiceProxy } from 'shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        PipelinesStoreModule,
        OrganizationUnitsStoreModule,
        SubscriptionsStoreModule
    ],
    providers: [ServiceProductServiceProxy]
})
export class CrmStoreModule {}
