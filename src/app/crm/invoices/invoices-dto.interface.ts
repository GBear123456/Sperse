export interface InvoiceDto {
    Id: number;
    Status: string;
    Number: string;
    ContactId: number;
    ContactName: string;
    GrandTotal: number;
    Date: string;
    PublicId: string;
}