import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { SubscriptionDto } from '@app/crm/orders/subcription-dto.interface';

export const SubscriptionFields: KeysEnum<SubscriptionDto> = {
    Id: 'Id',
    PhotoPublicId: 'PhotoPublicId',
    ContactId: 'ContactId',
    FirstName: 'FirstName',
    LastName: 'LastName',
    EmailAddress: 'EmailAddress',
    PhoneNumber: 'PhoneNumber',
    City: 'City',
    LeadId: 'LeadId',
    StateName: 'StateName',
    Zip: 'Zip',
    CountryCode: 'CountryCode',
    PersonalAffiliateCode: 'PersonalAffiliateCode',
    ContactDate: 'ContactDate',
    ServiceType: 'ServiceType',
    ServiceName: 'ServiceName',
    StartDate: 'StartDate',
    EndDate: 'EndDate',
    Fee: 'Fee',
    StatusId: 'StatusId',
    StatusName: 'StatusName',
    OrderAmount: 'OrderAmount',
    SourceAffiliateCode: 'SourceAffiliateCode',
    SourceEntryUrl: 'SourceEntryUrl',
    ContactGroupId: 'ContactGroupId',
    ContactXref: 'ContactXref',
    ServiceProductId: 'ServiceProductId',
    SourceOrganizationUnitId: 'SourceOrganizationUnitId'
};