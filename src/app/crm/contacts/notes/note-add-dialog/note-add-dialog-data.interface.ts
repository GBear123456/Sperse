import { ContactInfoDto, NoteInfoDto } from '@shared/service-proxies/service-proxies';

export interface NoteAddDialogData {
    note?: NoteInfoDto;
    contactInfo?: ContactInfoDto;
    propertyId: number;
}