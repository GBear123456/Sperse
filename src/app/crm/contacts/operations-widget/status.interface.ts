import { ContactStatus } from '@root/shared/AppEnums';

export interface Status {
    id: ContactStatus;
    name?: string;
    displayName?: string;
}