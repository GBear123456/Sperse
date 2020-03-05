/** Core imports */
import { Type } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import * as _ from 'underscore';
import camelCase from 'lodash/camelCase';

/** Application imports */
import { FilterItemModel, DisplayElement } from './filter-item.model';
import { FilterComponent } from '@shared/filters/models/filter-component';

export class FilterModelBase<T extends FilterItemModel> {
    component: Type<FilterComponent>;
    operator: any;
    caption: string;
    field?: any;
    items?: { [item: string]: T; };
    items$?: Observable<{ [item: string]: T; }>;
    displayElements?: any[];
    options?: any;
    hidden?: boolean;
    isSelected = false;

    public constructor(init?: Partial<FilterModelBase<T>>) {
        Object.assign(this, init);
        if (this.items$ && this.items$ instanceof Observable) {
            this.items$.subscribe(items => {
                this.items = items;
                this.updateCaptions();
            });
        }
        if (this.items) {
            this.updateCaptions();
        }
    }

    updateCaptions() {
        let displayElements: DisplayElement[] = [];

        _.each(_.values(_.mapObject(
            this.items, (item: FilterItemModel, key: string) => item && item.getDisplayElements && item.getDisplayElements(key)
        )), x => { displayElements = displayElements.concat(x); });
        this.displayElements = displayElements.filter((val) =>  val && val.displayValue);
    }

    clearFilterItems() {
        _.each(this.items, item => {
            if (item.removeFilterItem)
                item.removeFilterItem(this);
        });
    }

    getValues() {
        let values = {};
        if (this.options && this.options.method) {
            values = this[this.options.method](this.options.params);
        } else {
            for (let key in this.items) {
                const propName = key !== 'element' ? camelCase(key) : this.field || this.caption;
                values[propName] = this.items[key].value ? this.items[key].value.value || this.items[key].value : undefined;
            }
        }
        return values;
    }
}