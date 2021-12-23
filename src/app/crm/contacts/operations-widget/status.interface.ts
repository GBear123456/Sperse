import { ContactGroup, ContactStatus } from '@root/shared/AppEnums';

export interface Status {
    id: ContactStatus;
    name?: string;
    displayName?: string;
}

export interface GroupStatus {
    id: string;
    groupId: ContactGroup;
    name?: string;
    displayName?: string;
    isActive: boolean;
    disabled: boolean;
}