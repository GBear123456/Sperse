/** Core imports */
import { NgModule } from '@angular/core';

/** Third party imports */
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

/** Application imports */
import { AssignedUsersStoreModule } from '@app/crm/shared/store/assigned-users-store';
import { ListsStoreModule } from '@app/crm/shared/store/lists-store';
import { PartnerTypesStoreModule } from '@app/crm/shared/store/partner-types-store';
import { PipelinesStoreModule } from '@app/crm/shared/store/pipelines-store';
import { RatingsStoreModule } from '@app/crm/shared/store/ratings-store';
import { StarsStoreModule } from '@app/crm/shared/store/stars-store';
import { StatusesStoreModule } from '@app/crm/shared/store/statuses-store';
import { TagsStoreModule } from '@app/crm/shared/store/tags-store';

export function instrumentOptions() {
    return {
        maxAge: 10
    };
}

@NgModule({
    imports: [
        AssignedUsersStoreModule,
        ListsStoreModule,
        PartnerTypesStoreModule,
        PipelinesStoreModule,
        RatingsStoreModule,
        StarsStoreModule,
        StatusesStoreModule,
        TagsStoreModule,
        StoreModule.forRoot({}),
        EffectsModule.forRoot([]),
        StoreDevtoolsModule.instrument(instrumentOptions)
    ],
    declarations: []
})
export class CrmStoreModule {}
