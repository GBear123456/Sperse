import { ContactInfoDto } from '@shared/service-proxies/service-proxies';

export interface SmsDialogData {
    contact?: ContactInfoDto;
    firstName?: string;
    lastName?: string;
    parentId?: number;
    body?: string;
    phoneNumber?: string;
}