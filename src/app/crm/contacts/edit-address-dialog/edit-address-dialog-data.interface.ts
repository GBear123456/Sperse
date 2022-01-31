import { ContactGroupInfo } from '@shared/service-proxies/service-proxies';

export interface EditAddressDialogData {
    id: number;
    contactId: number;
    streetAddress: string;
    city: string;
    stateName: string;
    countryName: string;
    countryId?: string;
    stateId: string;
    neighborhood: string;
    zip: string;
    isCompany: boolean;
    usageTypeId: string;
    groups: ContactGroupInfo[];
    isActive: boolean;
    isConfirmed: boolean;
    comment: string;
    deleteItem: (e: MouseEvent) => void;
    isDeleteAllowed: boolean;
    showType: boolean;
    showNeighborhood: boolean;
    editDialogTitle: string;
    formattedAddress?: string;
}