import { FilterItemModel } from './filter-item.model';

export interface FilterComponent {
    items?: { [item: string]: FilterItemModel; };
    options?: any;
    apply: (event) => void;
    localizationSourceName: string;
}
