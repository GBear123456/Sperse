import { InvoiceStatus } from '@shared/service-proxies/service-proxies';

export interface InvoiceDto {
    Amount: number;
    CurrencyId: string;
    ContactId: number;
    Date: string;
    InvoiceDueDate: string;
    InvoiceId: number;
    InvoiceNumber: string;
    InvoiceStatus: InvoiceStatus;
    InvoicePublicId: string;
    FutureSubscriptionIsSetUp: boolean;
    Key: string;
    OrderId: number;
    OrderNumber: string;
    OrderStage: string;
    OrderType: string;
    AffiliateContactName: string;
}