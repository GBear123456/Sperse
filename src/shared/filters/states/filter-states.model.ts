import { FilterModel, FilterItemModel, DisplayElement } from '../filter.model';
import * as _ from 'lodash';

export class FilterStatesModel extends FilterItemModel {
    list: any[];

    getDisplayElements(): DisplayElement[] {
        var result = this.value && this.value.map(x => {
            let data = _.find(this.list, (val: any, i, arr) => val.code == x);
            if (data) {
                let displayValue = data.name + (data.parent ? ' (' + data.parent + ')' : '');
                return <DisplayElement>{ item: this, displayValue: displayValue, args: x }
            }
        });

        return result;        
    }

    removeFilterItem(filter: FilterModel, args: any) {
        _.remove(this.value, (val: any, i, arr) => val == args);
    }
}
