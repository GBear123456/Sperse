import { FilterItemModel } from '@shared/filters/models/filter-item.model';

export class FilterRangeModel extends FilterItemModel {
    min: number;
    max: number;
    step: number;

    public constructor(init?: Partial<FilterRangeModel>) {
        super();
        Object.assign(this, init);
    }
}