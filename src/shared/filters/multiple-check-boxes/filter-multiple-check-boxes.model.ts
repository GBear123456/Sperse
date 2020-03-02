import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';

export class FilterMultipleCheckBoxesModel extends FilterItemModel {
    keyExpr: any;
    parentExpr?: any = 'parentId';
    nameField: string;

    public constructor(init?: Partial<FilterMultipleCheckBoxesModel>) {
        super(init, true);
    }

    get value() {
        let result = [];
        this.dataSource && this.dataSource
            .filter(item => item.checkbox1 || item.checkbox2)
            .forEach((item, index) => {
                result.push(
                    {
                        name: ['subscriptionFilters[' + index + '].TypeId'],
                        value: item.id
                    },
                    {
                        name: ['subscriptionFilters[' + index + '].StatusId'],
                        value: 'A'
                    },
                    {
                        name: ['subscriptionFilters[' + index + '].HasSubscription'],
                        value: !!item.checkbox1
                    }
                );
            });
        return result;
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];
        if (this.dataSource) {
            this.dataSource.forEach((item) => {
                if (item.checkbox1 || item.checkbox2) {
                    result.push(<DisplayElement>{
                        item: this,
                        id: item.id,
                        displayValue: item.name + ' (' + (item.checkbox1 ? 'has' : 'doesn\'t have') + ')'
                    });
                }
            });
        }
        return result;
    }

    removeFilterItem(filter: FilterModel, args: any, id: string) {
        if (id) {
            let item = filter.items.element.dataSource.find((item) => item.id === id);
            item.checkbox1 = item.checkbox2 = null;
        }
    }
}
