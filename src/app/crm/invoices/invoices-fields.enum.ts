import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { InvoiceDto } from './invoices-dto.interface';

export const InvoiceFields: KeysEnum<InvoiceDto> = {
    Id: 'Id',
    Status: 'Status',
    Number: 'Number',
    GrandTotal: 'GrandTotal',
    CurrencyId: 'CurrencyId',
    Date: 'Date',
    DueDate: 'DueDate',
    Description: 'Description',
    Coupon: 'Coupon',
    PublicId: 'PublicId',
    FutureSubscriptionIsSetUp: 'FutureSubscriptionIsSetUp',

    LastPaymentDate: 'LastPaymentDate',
    LastPaymentGateway: 'LastPaymentGateway',
    LastPaymentType: 'LastPaymentType',

    ContactId: 'ContactId',
    FullName: 'FullName',
    EmailAddress: 'EmailAddress',
    PhotoPublicId: 'PhotoPublicId',
    AffiliateContactName: 'AffiliateContactName',
    OrderId: 'OrderId',
    OrderStageName: 'OrderStageName',
};