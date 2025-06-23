import { InvoiceStatus } from "@shared/service-proxies/service-proxies";

export interface InvoiceGridMenuDto {
    Id?: number;
    Number?: string;
    Status?: InvoiceStatus;
    Amount?: number;
    CurrencyId?: string;
    PublicId?: string;
    ContactId: number;
    OrderId: number;
    OrderStage: string;
}