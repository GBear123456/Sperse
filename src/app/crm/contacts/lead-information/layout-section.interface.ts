import { SectionItem } from '@app/crm/contacts/lead-information/section-item.interface';

export interface LayoutSection {
    name: string;
    icon: string;
    items: SectionItem[];
}