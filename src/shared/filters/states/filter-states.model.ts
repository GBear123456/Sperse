import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import * as _ from 'lodash';

export class FilterStatesModel extends FilterItemModel {
    list: any[];

    getDisplayElements(): DisplayElement[] {
        var result: DisplayElement[] = this.value && this.value.map(x => {
            let data = _.find(this.list, (val: any, i, arr) => val.code == x);
            if (data) {
                let parentName = data.parent ? _.find(this.list, (val) => val.code == data.parent).name : null;
                return <DisplayElement>{ item: this, displayValue: data.name, args: x, parentCode: data.parent, parentName: parentName }
            }
        }).filter(Boolean);
        
        result = this.generateParents(result);
        result = _.sortBy(result, x => {
            let res = '';
            if (x.parentName) res = x.parentName + ':';
            res += x.displayValue;
            return res;
        });
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

        arr = _.sortBy(arr, x => x.args);
        _.each(arr, x => {
            if (x.parentCode) {
                let parent = _.find(result, y => y.args == x.parentCode);
                if (!parent) {
                    let parentName = _.find(this.list, (val: any, i, arr) => val.code == x.parentCode).name;
                    result.push(<DisplayElement>{ displayValue: parentName, readonly: true, args: x.parentCode });
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
