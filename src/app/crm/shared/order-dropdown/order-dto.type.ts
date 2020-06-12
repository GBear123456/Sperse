import { OrderDto as FullOrderDto } from '@app/crm/orders/order-dto';

export type OrderDto = Pick<FullOrderDto, 'Id' | 'Number'>;