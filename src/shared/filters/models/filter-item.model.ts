import { FilterModel } from './filter.model';
import capitalize from 'underscore.string/capitalize';
import { Observable } from 'rxjs';

export class FilterItemModel {
    dataSource: any;
    dataSource$: Observable<any>;
    selectedKeys$: Observable<any>;
    disableOuterScroll: boolean;
    protected _value: any = '';

    public constructor(value?: any, isPartial = false) {
        if (isPartial)
            Object.assign(this, value);
        else if (value)
            this.value = value;

        if (this.dataSource$)
            this.dataSource$.subscribe(source => {
                this.dataSource = source;
            });

        if (this.selectedKeys$)
            this.selectedKeys$.subscribe(keys => {
                this.value = keys;
            });
    }

    get value(): any {
        return this._value;
    }
    set value(value: any) {
        this._value = value;
    }

    dispatchValue(value: any, filter: FilterModel) {
        this.value = value;
    }

    getDisplayElements(key: string): DisplayElement[] {
        let caption = capitalize(key);
        let valueType = typeof (this.value);
        let isBoolValues = valueType == 'boolean';
        let value = valueType == 'string' && this.value
            || valueType == 'number' && (caption ? `${caption}: ${this.value}` : this.value)
            || isBoolValues && this.value && caption
            || this.value && this.value['getDate'] && (caption + ': ' +
            this.value.toLocaleDateString().split('/').map((part) => {
                return part.length >= 2 ? part : '0' + part;
            }).join('/'));

        return [<DisplayElement>{ item: this, displayValue: value }];
    }

    removeFilterItem(filter: FilterModel, args?: any) {
        if ((typeof (this.value) == 'string') || (this.value instanceof Date))
            this.value = '';
        else if (typeof (this.value) == 'boolean')
            this.value = false;
        else
            this.value = undefined;
    }
}

export class DisplayElement {
    item: FilterItemModel;
    displayValue: string;
    parentCode?: any;
    sortField?: any;
    readonly?: boolean;
    args?: any;
}
