import { ContactInfoDto } from '@shared/service-proxies/service-proxies';

export interface AddCompanyDialogData {
    leadId: number;
    contactId: number;
    contactInfo: ContactInfoDto;
    updateLocation: (contactId: number, leadId: number, organizationId: number) => void;
}