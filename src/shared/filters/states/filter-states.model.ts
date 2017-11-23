import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import * as _ from 'lodash';

export class FilterStatesModel extends FilterItemModel {
    list: any[];

    getDisplayElements(): DisplayElement[] {
        var result: DisplayElement[] = this.value && this.value.map(x => {
            let data = _.find(this.list, (val: any, i, arr) => val.code == x);
            if (data) {
                return <DisplayElement>{ item: this, displayValue: data.name, args: x, isNested: !!data.parent }
            }
        }).filter(Boolean);

        return _.sortBy(result, x => x.args);
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (args)
            _.remove(this.value, (val: any, i, arr) => val == args);
        else
            this.value = [];
    }
}
