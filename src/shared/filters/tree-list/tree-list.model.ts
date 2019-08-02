import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import * as _ from 'lodash';

export class FilterTreeListModel extends FilterItemModel {
    list: any[];

    public constructor(init?: Partial<FilterTreeListModel>) {
        super(init, true);
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];
        this.value && this.value.map(itemId => {
            let data = _.find(this.list, (val: any, i, arr) => val.id == itemId);
            if (data) {
                let parentName = data.parent ? _.find(this.list, (val) => val.id == data.parent).name : null;
                let sortField = (parentName) ? parentName + ':' : '';
                sortField += data.name;
                result.push(<DisplayElement>{   
                    item: this, 
                    displayValue: data.name, 
                    args: itemId, 
                    parentCode: data.parent, 
                    sortField: sortField 
                });
            }
        });
       
        result = this.generateParents(
            _.sortBy(result, 'sortField')
        );
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
        _.each(arr, item => {
            if (item.parentCode) {
                let parent = _.find(result, y => y.args == item.parentCode);
                if (!parent) {
                    let parentName = _.find(this.list, (val: any, i, arr) => val.id == item.parentCode).name;
                    result.push(<DisplayElement>{ displayValue: parentName, readonly: true, args: item.parentCode });
                }
            }

            result.push(item);
        });

        return result;
    }
}