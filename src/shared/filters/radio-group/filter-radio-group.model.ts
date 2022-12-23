import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';

export class FilterRadioGroupModel extends FilterItemModel {
    list: any[];
    showFirstAsDefault: boolean;

    public constructor(init?: Partial<FilterRadioGroupModel>) {
        super(init, true);
    }

    set value(value: any) {
        this._value = value;
    }

    get value(): any {
        return !this._value && this.canShowFirstAsDefault() ? this.list[0].id : this._value;
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

        if (this.canShowFirstAsDefault() && !result.length)
            return [<DisplayElement>{
                item: this,
                displayValue: this.list[0].displayName || this.list[0].name
            }];
        else
            return result;
    }

    private canShowFirstAsDefault(): boolean {
        return this.showFirstAsDefault && this.list.length !== 0;
    }
}
