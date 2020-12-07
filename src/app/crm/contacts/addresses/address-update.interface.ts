import { AddressDto } from '@app/crm/contacts/addresses/address-dto.model';
import { UpdateDialogData } from '@app/crm/contacts/addresses/update-dialog-data.type';

export interface AddressUpdate {
    address: AddressDto;
    dialogData: UpdateDialogData;
}