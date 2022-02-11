/** Core imports */
import { NgModule } from '@angular/core';

/** Application imports */
import { ContactAssignedUsersStoreModule } from '@app/store/assigned-users-store/contact-assigned-users-store';
import { ActivityAssignedUsersStoreModule } from '@app/store/assigned-users-store/activity-assigned-users-store';
import { ContactLinkTypesStoreModule } from '@app/store/contact-link-types-store';
import { ListsStoreModule } from '@app/store/lists-store';
import { PartnerTypesStoreModule } from '@app/store/partner-types-store';
import { RatingsStoreModule } from '@app/store/ratings-store';
import { StarsStoreModule } from '@app/store/stars-store';
import { TagsStoreModule } from '@app/store/tags-store';
import { OrganizationTypeStoreModule } from '@app/store/organization-types-store';

@NgModule({
    imports: [
        ContactAssignedUsersStoreModule,
        ActivityAssignedUsersStoreModule,
        ContactLinkTypesStoreModule,
        ListsStoreModule,
        PartnerTypesStoreModule,
        RatingsStoreModule,
        StarsStoreModule,
        TagsStoreModule,
        OrganizationTypeStoreModule
    ],
    declarations: []
})
export class AppStoreModule {}
