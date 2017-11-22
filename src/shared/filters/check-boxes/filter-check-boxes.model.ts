import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import * as _ from 'lodash';

export class FilterCheckBoxesModel extends FilterItemModel {
    dataSource: any;
    keyExpr: any;
    parentExpr: any;
    nameField: string;

    public constructor(init?: Partial<FilterCheckBoxesModel>) {
        super();
        Object.assign(this, init);
    }
    
    getDisplayElements(): DisplayElement[] {
        var result: DisplayElement[] = this.value && this.value.map(x => {
            let data = _.find(this.dataSource, (val: any, i, arr) => val.id == x);
            if (data) {
                let displayValue = data.name + (data.parent ? ' (' + data.parent + ')' : '');
                return <DisplayElement>{ item: this, displayValue: displayValue, args: x }
            }
        });

        return _.sortBy(result, x => x.args);
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (args)
            _.remove(this.value, (val: any, i, arr) => val == args);
        else
            this.value = [];
    }
}
