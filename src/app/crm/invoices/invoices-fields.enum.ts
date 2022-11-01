import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { InvoiceDto } from './invoices-dto.interface';

export const InvoiceFields: KeysEnum<InvoiceDto> = {
    Id: 'Id',
    Status: 'Status',
    Number: 'Number',
    ContactId: 'ContactId',
    FullName: 'FullName',
    EmailAddress: 'EmailAddress',
    PhotoPublicId: 'PhotoPublicId',
    GrandTotal: 'GrandTotal',
    Date: 'Date',
    PublicId: 'PublicId'
};