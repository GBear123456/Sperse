import { EditAddressDialogData } from '@app/crm/contacts/edit-address-dialog/edit-address-dialog-data.interface';

export type UpdateDialogData = Pick<EditAddressDialogData, 'id' | 'contactId' | 'city' | 'countryName' | 'countryId'
    | 'isActive' | 'isConfirmed' | 'stateId' | 'stateName' | 'neighborhood' | 'streetAddress' | 'comment' | 'usageTypeId' | 'zip'
    | 'formattedAddress'>;