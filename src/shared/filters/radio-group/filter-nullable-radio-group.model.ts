import { FilterRadioGroupModel } from '@shared/filters/radio-group/filter-radio-group.model';
import { FilterModel } from '@shared/filters/models/filter.model';

export class FilterNullableRadioGroupModel extends FilterRadioGroupModel {
    removeFilterItem(filter: FilterModel, args?: any) {
        this.value = undefined;
    }
}
