import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { InvoiceDto } from '@app/crm/contacts/notes/note-add-dialog/invoice-dto.type';

export const InvoiceFields: KeysEnum<InvoiceDto> = {
    Key: 'Key',
    OrderId: 'OrderId',
    ContactId: 'ContactId',
    OrderStage: 'OrderStage',
    OrderType: 'OrderType',
    Date: 'Date'
};