/** Core imports */
import { NgModule } from '@angular/core';

/** Application imports */
import { AddressUsageTypesStoreModule } from '@app/store/address-usage-types-store';
import { ContactAssignedUsersStoreModule } from '@app/store/assigned-users-store/contact-assigned-users-store';
import { ActivityAssignedUsersStoreModule } from '@app/store/assigned-users-store/activity-assigned-users-store';
import { ContactLinkTypesStoreModule } from '@app/store/contact-link-types-store';
import { EmailUsageTypesStoreModule } from '@app/store/email-usage-types-store';
import { ListsStoreModule } from '@app/store/lists-store';
import { PartnerTypesStoreModule } from '@app/store/partner-types-store';
import { PhoneUsageTypesStoreModule } from '@app/store/phone-usage-types-store';
import { CountriesStoreModule } from '@app/store/countries-store';
import { RatingsStoreModule } from '@app/store/ratings-store';
import { StarsStoreModule } from '@app/store/stars-store';
import { StatusesStoreModule } from '@app/store/statuses-store';
import { TagsStoreModule } from '@app/store/tags-store';
import { OrganizationTypeStoreModule } from '@app/store/organization-types-store';

@NgModule({
    imports: [
        AddressUsageTypesStoreModule,
        ContactAssignedUsersStoreModule,
        ActivityAssignedUsersStoreModule,
        ContactLinkTypesStoreModule,
        EmailUsageTypesStoreModule,
        ListsStoreModule,
        PartnerTypesStoreModule,
        PhoneUsageTypesStoreModule,
        CountriesStoreModule,
        RatingsStoreModule,
        StarsStoreModule,
        StatusesStoreModule,
        TagsStoreModule,
        OrganizationTypeStoreModule
    ],
    declarations: []
})
export class AppStoreModule {}
