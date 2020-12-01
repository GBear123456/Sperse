export interface EditAddressDialogData {
    id: number;
    contactId: number;
    streetAddress: string;
    city: string;
    stateName: string;
    country: string;
    countryCode?: string;
    stateId: string;
    zip: string;
    isCompany: boolean;
    usageTypeId: string;
    groupId: string;
    isActive: boolean;
    isConfirmed: boolean;
    comment: string;
    deleteItem: (e: MouseEvent) => void;
    isDeleteAllowed: boolean;
    showType: boolean;
    editDialogTitle: string;
    formattedAddress?: string;
}