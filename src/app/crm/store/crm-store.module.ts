/** Core imports */
import { NgModule } from '@angular/core';

/** Application imports */
import { PipelinesStoreModule } from '@app/crm/store/pipelines-store';
import { OrganizationUnitsStoreModule } from '@app/crm/store/organization-units-store';

@NgModule({
    imports: [
        PipelinesStoreModule,
        OrganizationUnitsStoreModule
    ],
    declarations: []
})
export class CrmStoreModule {}
