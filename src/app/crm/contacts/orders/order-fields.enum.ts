import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { OrderDto } from '@app/crm/contacts/orders/order-dto.type';

export const OrderFields: KeysEnum<OrderDto> = {
    'Id': 'Id',
    'Number': 'Number',
    'Amount': 'Amount',
    'OrderType': 'OrderType',
    'Stage': 'Stage',
    'OrderDate': 'OrderDate',
    'DateProcessed': 'DateProcessed'
};