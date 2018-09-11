/** Core imports */
import { NgModule } from '@angular/core';

/** Application imports */
import { AddressUsageTypesStoreModule } from '@app/crm/store/address-usage-types-store';
import { AssignedUsersStoreModule } from '@app/crm/store/assigned-users-store';
import { ContactLinkTypesStoreModule } from '@app/crm/store/contact-link-types-store';
import { EmailUsageTypesStoreModule } from '@app/crm/store/email-usage-types-store';
import { ListsStoreModule } from '@app/crm/store/lists-store';
import { PartnerTypesStoreModule } from '@app/crm/store/partner-types-store';
import { PhoneUsageTypesStoreModule } from '@app/crm/store/phone-usage-types-store';
import { PipelinesStoreModule } from '@app/crm/store/pipelines-store';
import { RatingsStoreModule } from '@app/crm/store/ratings-store';
import { StarsStoreModule } from '@app/crm/store/stars-store';
import { StatusesStoreModule } from '@app/crm/store/statuses-store';
import { TagsStoreModule } from '@app/crm/store/tags-store';

@NgModule({
    imports: [
        AddressUsageTypesStoreModule,
        AssignedUsersStoreModule,
        ContactLinkTypesStoreModule,
        EmailUsageTypesStoreModule,
        ListsStoreModule,
        PartnerTypesStoreModule,
        PhoneUsageTypesStoreModule,
        PipelinesStoreModule,
        RatingsStoreModule,
        StarsStoreModule,
        StatusesStoreModule,
        TagsStoreModule
    ],
    declarations: []
})
export class CrmStoreModule {}
