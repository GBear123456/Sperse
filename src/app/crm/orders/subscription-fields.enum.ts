import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { SubscriptionDto } from '@app/crm/orders/subcription-dto.interface';

export const SubscriptionFields: KeysEnum<SubscriptionDto> = {
    Id: 'Id',
    PhotoPublicId: 'PhotoPublicId',
    ContactId: 'ContactId',
    FullName: 'FullName',
    EmailAddress: 'EmailAddress',
    PhoneNumber: 'PhoneNumber',
    City: 'City',
    LeadId: 'LeadId',
    StateName: 'StateName',
    Zip: 'Zip',
    CountryCode: 'CountryCode',
    PersonalAffiliateCode: 'PersonalAffiliateCode',
    PersonalAffiliateCodes: 'PersonalAffiliateCodes',
    ContactDate: 'ContactDate',
    ProductName: 'ProductName',
    StartDate: 'StartDate',
    EndDate: 'EndDate',
    Fee: 'Fee',
    CurrencyId: 'CurrencyId',
    StatusId: 'StatusId',
    StatusName: 'StatusName',
    OrderAmount: 'OrderAmount',
    SourceAffiliateCode: 'SourceAffiliateCode',
    SourceEntryUrl: 'SourceEntryUrl',
    ContactXrefs: 'ContactXrefs',
    SourceOrganizationUnitId: 'SourceOrganizationUnitId'
};