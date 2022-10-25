export interface InvoiceDto {
    Id: number;
    Status: string;
    Number: string;
    ContactId: number;
    FullName: string;
    EmailAddress: string;
    PhotoPublicId: string;
    GrandTotal: number;
    Date: string;
    PublicId: string;
}