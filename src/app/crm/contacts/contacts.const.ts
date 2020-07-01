/* Right panel configuration Ids */
export const RP_DEFAULT_ID      = 0;
export const RP_USER_INFO_ID    = 1;
export const RP_LEAD_INFO_ID    = 2;
export const RP_CONTACT_INFO_ID = 3;

/* Supported email tags */
export enum EmailTags {
    ClientFirstName   = 'ClientFirstName',
    ClientLastName    = 'ClientLastName',
    LegalName         = 'LegalName',
    InvoiceNumber     = 'InvoiceNumber',
    InvoiceGrandTotal = 'InvoiceGrandTotal',
    InvoiceDueDate    = 'InvoiceDueDate',
    InvoiceLink       = 'InvoiceLink',
    InvoiceAnchor     = 'InvoiceAnchor',
    SenderFullName    = 'SenderFullName',
    SenderCompany     = 'SenderCompany',
    SenderCompanyTitle= 'SenderCompanyTitle',
    SenderCompanyLogo = 'SenderCompanyLogo',
    SenderPhone       = 'SenderPhone',
    SenderEmail       = 'SenderEmail',
    SenderWebSite     = 'SenderWebSite',
}