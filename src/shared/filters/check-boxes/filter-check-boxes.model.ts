import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import * as _ from 'lodash';

export class FilterCheckBoxesModel extends FilterItemModel {
    dataSource: any;
    keyExpr: any;
    parentExpr?: any = 'parentId';
    nameField: string;

    public constructor(init?: Partial<FilterCheckBoxesModel>) {
        super();
        Object.assign(this, init);
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];
        this.value && this.value.sort().forEach(x => {
            let data = _.find(this.dataSource, (val: any, i, arr) => val.id == x);
            data && result.push(<DisplayElement>{ 
                item: this, 
                displayValue: data.name, 
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
        _.each(arr, x => {
            if (x.parentCode) {
                let parent = _.find(result, y => y.args == x.parentCode);
                if (!parent) {
                    let parentName = _.find(this.dataSource, (val: any, i, arr) => val.id == x.parentCode).name;
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

    removeFilterItem(filter: FilterModel, args: any) {
        if (args)
            _.remove(this.value, (val: any, i, arr) => val == args);
        else
            this.value = [];
    }
}
