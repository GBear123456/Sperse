/** Core imports */
import { NgModule } from '@angular/core';

/** Application imports */
import { AssignedUsersStoreModule } from '@app/crm/store/assigned-users-store';
import { ListsStoreModule } from '@app/crm/store/lists-store';
import { PartnerTypesStoreModule } from '@app/crm/store/partner-types-store';
import { PipelinesStoreModule } from '@app/crm/store/pipelines-store';
import { RatingsStoreModule } from '@app/crm/store/ratings-store';
import { StarsStoreModule } from '@app/crm/store/stars-store';
import { StatusesStoreModule } from '@app/crm/store/statuses-store';
import { TagsStoreModule } from '@app/crm/store/tags-store';

@NgModule({
    imports: [
        AssignedUsersStoreModule,
        ListsStoreModule,
        PartnerTypesStoreModule,
        PipelinesStoreModule,
        RatingsStoreModule,
        StarsStoreModule,
        StatusesStoreModule,
        TagsStoreModule
    ],
    declarations: []
})
export class CrmStoreModule {}
