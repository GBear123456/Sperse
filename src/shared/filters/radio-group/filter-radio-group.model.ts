import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import * as _ from 'lodash';

export class FilterRadioGroupModel extends FilterItemModel {
    list: any[];

    public constructor(init?: Partial<FilterRadioGroupModel>) {
        super();
        Object.assign(this, init);
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];
        this.list.every((item: any) => {
            let selected = item.id == this.value;
            if (selected)
                result.push(<DisplayElement>{ 
                    item: this, 
                    displayValue: item.displayName || item.name
                });
            return !selected;
        });

        return result;
    }
}
