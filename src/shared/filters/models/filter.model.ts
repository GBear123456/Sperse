import { Type } from '@angular/core';
import { FilterItemModel } from './filter-item.model';
import { FilterComponent } from './filter-component';

import * as _ from 'underscore';

export class FilterModelBase<T extends FilterItemModel> {
    component: Type<FilterComponent>;
    operator: any;
    caption: string;
    field?: any;
    items?: { [item: string]: T; };
    displayElements?: any[];

    public constructor(init?: Partial<FilterModelBase<T>>) {
        Object.assign(this, init);
    }

    updateCaptions() {
        let displayElements = [];

        _.each(_.values(_.mapObject(
            this.items, (item: FilterItemModel, key: string) => item.getDisplayElements(key)
        )), x => { displayElements = displayElements.concat(x); });
        this.displayElements = displayElements;
    }

    clearFilterItems() {
        _.each(this.items, i => i.removeFilterItem(this));
    }
}

export class FilterModel extends FilterModelBase<FilterItemModel> { }
