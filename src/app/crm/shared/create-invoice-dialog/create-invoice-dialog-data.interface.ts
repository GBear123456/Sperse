import { ContactInfoDto } from '@shared/service-proxies/service-proxies';
import { InvoiceDto } from '@app/crm/contacts/invoices/invoice-dto.interface';

export interface CreateInvoiceDialogData {
    contactInfo?: ContactInfoDto;
    invoice?: InvoiceDto;
    refreshParent?: () => void;
    saveAsDraft?: boolean;
    addNew?: boolean;
}