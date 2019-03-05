import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import find from 'lodash/find';
import sortBy from 'lodash/sortBy';
import remove from 'lodash/remove';
import each from 'lodash/each';

export class FilterStatesModel extends FilterItemModel {
    list: any[];

    getDisplayElements(): DisplayElement[] {
        var result: DisplayElement[] = [];
        this.value && this.value.map(x => {
            let data = find(this.list, (val: any, i, arr) => val.code == x);
            if (data) {
                let parentName = data.parent ? find(this.list, (val) => val.code == data.parent).name : null;
                let sortField = (parentName) ? parentName + ':' : '';
                sortField += data.name;
                result.push(<DisplayElement>{   
                    item: this, 
                    displayValue: data.name, 
                    args: x, 
                    parentCode: data.parent, 
                    sortField: sortField 
                });
            }
        });
       
        result = this.generateParents(
            sortBy(result, 'sortField')
        );
        return result;
    }
   
    removeFilterItem(filter: FilterModel, args: any) {
        if (args)
            remove(this.value, (val: any, i, arr) => val == args);
        else
            this.value = [];
    }

    private generateParents(arr: DisplayElement[]): DisplayElement[] {
        let result: DisplayElement[] = [];
        each(arr, x => {
            if (x.parentCode) {
                let parent = find(result, y => y.args == x.parentCode);
                if (!parent) {
                    let parentName = find(this.list, (val: any, i, arr) => val.code == x.parentCode).name;
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
