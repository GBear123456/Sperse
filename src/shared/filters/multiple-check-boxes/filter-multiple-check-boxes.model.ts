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
        return this.dataSource && this.dataSource
            .filter(item => item.checkbox1 || item.checkbox2)
            .map((item) => ({
                TypeId: item.id,
                Status: 'A',
                HasSubscription: !!item.checkbox1
            }));
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
