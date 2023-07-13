import { InvoiceStatus } from "@shared/service-proxies/service-proxies";

export interface InvoiceDto {
    Id: number;
    Status: InvoiceStatus;
    Number: string;
    GrandTotal: number;
    Date: string;
    DueDate: string;
    Description: string;
    Coupon: string;
    PublicId: string;
    FutureSubscriptionIsSetUp: boolean;

    LastPaymentDate: string;
    LastPaymentGateway: string;
    LastPaymentType: string;

    ContactId: number;
    FullName: string;
    EmailAddress: string;
    PhotoPublicId: string;
    AffiliateContactName: string;
    OrderId: number;
    OrderStageName: string;
}

export enum InvoiceStatusQuickFitler {
    All = 'All',
    Draft = 'Draft',
    Paid = 'Paid',
    Unpaid = 'Unpaid',
    Due = 'Due',
    Overdue = 'Overdue'
}

export enum InvoiceDueStatus {
    InTime = 'InTime',
    Due = 'Due',
    Overdue = 'Overdue',
    Pending = 'Pending'
}