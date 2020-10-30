import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { PartnerDto } from '@app/crm/partners/partner-dto.interface';

export const PartnerFields: KeysEnum<PartnerDto> = {
    Name: 'Name',
    CompanyName: 'CompanyName',
    PhotoPublicId: 'PhotoPublicId',
    Email: 'Email',
    Phone: 'Phone',
    City: 'City',
    OrganizationId: 'OrganizationId',
    State: 'State',
    Status: 'Status',
    ContactDate: 'ContactDate',
    Id: 'Id',
    PartnerType: 'PartnerType',
    Xref: 'Xref',
    AffiliateCode: 'AffiliateCode',
    UserId: 'UserId',
    AffiliateContactName: 'AffiliateContactName',
    AffiliateContactEmailAddress: 'AffiliateContactEmailAddress',
    AffiliateContactAffiliateCode: 'AffiliateContactAffiliateCode',
    AffiliateRate: 'AffiliateRate'
};