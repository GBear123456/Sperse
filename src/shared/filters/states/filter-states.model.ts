import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import * as _ from 'lodash';

export class FilterStatesModel extends FilterItemModel {
    list: any[];

    getDisplayElements(): DisplayElement[] {
        var result: DisplayElement[] = this.value && this.value.map(x => {
            let data = _.find(this.list, (val: any, i, arr) => val.code == x);
            if (data) {
                return <DisplayElement>{ item: this, displayValue: data.name, args: x, parent: data.parent }
            }
        }).filter(Boolean);

        result = _.sortBy(result, x => x.args);
        result = this.generateParents(result);
        return result;
    }
   
    removeFilterItem(filter: FilterModel, args: any) {
        if (args)
            _.remove(this.value, (val: any, i, arr) => val == args);
        else
            this.value = [];
    }

    private generateParents(arr: DisplayElement[]): DisplayElement[] {
        let result: DisplayElement[] = [];
        _.each(arr, x => {
            if (x.parent) {
                let parent = _.find(result, y => y.args == x.parent);
                if (!parent) {
                    let parentName = _.find(this.list, (val: any, i, arr) => val.code == x.parent).name;
                    result.push(<DisplayElement>{ displayValue: parentName, readonly: true, args: x.parent });
                }
                result.push(x);
            }
            else {
                result.push(x);
            }
        });

        return result;
    }
}
