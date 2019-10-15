import { ContactGroup } from '@shared/AppEnums';
import { ContextType } from '@app/crm/contacts/details-header/context-type.enum';

export interface ContextMenuItem {
    type: ContextType;
    text: string;
    selected: boolean;
    icon: string;
    visible: boolean;
    contactGroups: ContactGroup[];
}
