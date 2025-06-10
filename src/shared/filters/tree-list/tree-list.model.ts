import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import find from 'lodash/find';
import sortBy from 'lodash/sortBy';
import each from 'lodash/each';
import remove from 'lodash/remove';

export class FilterTreeListModel extends FilterItemModel {
    list: any[];

    public constructor(init?: Partial<FilterTreeListModel>) {
        super(init, true);
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];
        this.value && this.value.map(itemId => {
            let data = find(this.list, (val: any) => val.id == itemId);
            if (data) {
                let parentName = data.parent ? find(this.list, (val) => val.id == data.parent).name : null;
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
            sortBy(result, 'sortField')
        );
        return result;
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (args)
            remove(this.value, (val: any) => val == args);
        else
            this.value = [];
    }

    private generateParents(arr: DisplayElement[]): DisplayElement[] {
        let result: DisplayElement[] = [];
        each(arr, item => {
            if (item.parentCode) {
                let parent = find(result, y => y.args == item.parentCode);
                if (!parent) {
                    let parentName = find(this.list, (val: any) => val.id == item.parentCode).name;
                    result.push(<DisplayElement>{ displayValue: parentName, readonly: true, args: item.parentCode });
                }
            }

            result.push(item);
        });

        return result;
    }
}