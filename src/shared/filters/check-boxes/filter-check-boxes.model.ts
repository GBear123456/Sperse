import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import each from 'lodash/each';
import remove from 'lodash/remove';

export class FilterCheckBoxesModel extends FilterItemModel {
    keyExpr: any;
    parentExpr?: any = 'parentId';
    nameField: string;
    templateFunc?: (itemData) => string;

    public constructor(init?: Partial<FilterCheckBoxesModel>) {
        super(init, true);
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];
        let values = this.value && this.value.sort ? this.value.sort() : [ this.value ];
        values.forEach(x => {
            let data = this.dataSource.find((val: any) => val.id == x);
            data && result.push(<DisplayElement>{
                item: this,
                displayValue: data.name || data.displayName,
                args: x,
                parentCode: data[this.parentExpr],
                sortField: x
            });
        });

        result = this.generateParents(result);
        return result;
    }

    private generateParents(arr: DisplayElement[]): DisplayElement[] {
        let result: DisplayElement[] = [];
        each(arr, x => {
            if (x.parentCode) {
                let parent = result.find(y => y.args == x.parentCode);
                if (!parent) {
                    let parentName = this.dataSource.find((val: any) => val.id == x.parentCode).name;
                    result.push(<DisplayElement>{ displayValue: parentName, readonly: true, args: x.parentCode });
                }
                result.push(x);
            } else {
                result.push(x);
            }
        });

        return result;
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (args)
            remove(this.value, (val: any) => val == args);
        else
            this.value = [];
    }
}
