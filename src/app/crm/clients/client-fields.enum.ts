import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ContactDto } from '@app/crm/clients/contact.dto';

export const ClientFields: KeysEnum<ContactDto> = {
    Id: 'Id',
    Name: 'Name',
    CompanyName: 'CompanyName',
    Email: 'Email',
    PhotoPublicId: 'PhotoPublicId',
    Phone: 'Phone',
    City: 'City',
    State: 'State',
    Status: 'Status',
    StatusId: 'StatusId',
    ContactDate: 'ContactDate',
    OrganizationId: 'OrganizationId',
    Xref: 'Xref',
    AffiliateCode: 'AffiliateCode',
    AssignedUserName: 'AssignedUserName',
    BankCode: 'BankCode',
    UserId: 'UserId',
    SourceContactId: 'SourceContactId',
    ParentId: 'ParentId',
    GroupId: 'GroupId',
    AffiliateContactName: 'AffiliateContactName',
    AffiliateContactEmailAddress: 'AffiliateContactEmailAddress',
    AffiliateContactAffiliateCode: 'AffiliateContactAffiliateCode',
    AffiliateContactId: 'AffiliateContactId',
    AffiliateRate: 'AffiliateRate',
    AffiliateRateTier2: 'AffiliateRateTier2'
};