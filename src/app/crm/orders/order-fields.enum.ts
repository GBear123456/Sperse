import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { OrderDto } from '@app/crm/orders/order-dto';

export const OrderFields: KeysEnum<OrderDto> = {
    Id: 'Id',
    PhotoPublicId: 'PhotoPublicId',
    Name: 'Name',
    Email: 'Email',
    State: 'State',
    Phone: 'Phone',
    Number: 'Number',
    Stage: 'Stage',
    StageId: 'StageId',
    ContactId: 'ContactId',
    LeadId: 'LeadId',
    Amount: 'Amount',
    CurrencyId: 'CurrencyId',
    OrderType: 'OrderType',
    OrderDate: 'OrderDate',
    AffiliateContactAffiliateCode: 'AffiliateContactAffiliateCode',
    AffiliateContactAffiliateCodes: 'AffiliateContactAffiliateCodes',
    AffiliateContactId: 'AffiliateContactId',
    AffiliateContactName: 'AffiliateContactName',
    PersonalAffiliateCode: 'PersonalAffiliateCode',
    PersonalAffiliateCodes: 'PersonalAffiliateCodes',
    SourceAffiliateCode: 'SourceAffiliateCode',
    SourceEntryUrl: 'SourceEntryUrl',
    DateProcessed: 'DateProcessed',
    ContactGroupId: 'ContactGroupId',
    ContactXrefs: 'ContactXrefs',
    SourceOrganizationUnitId: 'SourceOrganizationUnitId'
};