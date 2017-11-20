import { FilterItemModel } from './filter-item.model';

export interface FilterComponent {
    items?: { [item: string]: FilterItemModel; };
    apply: (event) => void;
    localizationSourceName: string;
}
