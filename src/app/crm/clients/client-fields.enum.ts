import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ContactDto } from '@app/crm/clients/contact.dto';

export const ClientFields: KeysEnum<ContactDto> = {
    Id: 'Id',
    Name: 'Name',
    CompanyName: 'CompanyName',
    SourceOrganizationUnitId: 'SourceOrganizationUnitId',
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
    UserId: 'UserId'
}