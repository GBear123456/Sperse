import { InvoiceDto as FullInvoiceDto} from '@app/crm/contacts/invoices/invoice-dto.interface';

export type InvoiceDto = Pick<FullInvoiceDto,
    'Key'
    | 'OrderId'
    | 'ContactId'
    | 'OrderStage'
    | 'OrderType'
    | 'Date'>;