import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { InvoiceDto } from '@app/crm/contacts/invoices/invoice-dto.interface';

export const InvoiceFields: KeysEnum<InvoiceDto> = {
    Amount: 'Amount',
    Date: 'Date',
    ContactId: 'ContactId',
    InvoiceDueDate: 'InvoiceDueDate',
    InvoiceId: 'InvoiceId',
    InvoiceNumber: 'InvoiceNumber',
    InvoiceStatus: 'InvoiceStatus',
    InvoicePublicId: 'InvoicePublicId',
    Key: 'Key',
    OrderId: 'OrderId',
    OrderNumber: 'OrderNumber',
    OrderStage: 'OrderStage',
    OrderType: 'OrderType',
    AffiliateContactName: 'AffiliateContactName'
};