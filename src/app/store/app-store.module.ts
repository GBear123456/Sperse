/** Core imports */
import { NgModule } from '@angular/core';

/** Application imports */
import { AddressUsageTypesStoreModule } from '@app/store/address-usage-types-store';
import { CustomerAssignedUsersStoreModule } from '@app/store/assigned-users-store/customer-assigned-users-store';
import { LeadAssignedUsersStoreModule } from '@app/store/assigned-users-store/lead-assigned-users-store';
import { PartnerAssignedUsersStoreModule } from '@app/store/assigned-users-store/partner-assigned-users-store';
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

@NgModule({
    imports: [
        AddressUsageTypesStoreModule,
        CustomerAssignedUsersStoreModule,
        LeadAssignedUsersStoreModule,
        PartnerAssignedUsersStoreModule,
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
        TagsStoreModule
    ],
    declarations: []
})
export class AppStoreModule {}
