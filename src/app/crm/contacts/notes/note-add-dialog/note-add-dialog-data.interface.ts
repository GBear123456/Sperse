import { ContactInfoDto, NoteInfoDto } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '@app/crm/contacts/contacts.service';

export interface NoteAddDialogData {
    note?: NoteInfoDto;
    contactInfo?: ContactInfoDto;
    propertyId: number;
    contactsService: ContactsService;
}