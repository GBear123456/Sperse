import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import each from 'lodash/each';
import remove from 'lodash/remove';

export class FilterCheckBoxesModel extends FilterItemModel {
    keyExpr: any;
    itemsExpr?: string;
    parentExpr = 'parentId';
    nameField: string;
    dataStructure?: string;
    recursive?: boolean;
    templateFunc?: (itemData) => string;
    selectedItems: any[];

    public constructor(init?: Partial<FilterCheckBoxesModel>) {
        super(init, true);
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];
        let values = this.value && this.value.sort ? this.value.sort() : [ this.value ];
        values.forEach(id => {
            let parentId, data = this.dataSource && (this.itemsExpr ?
                this.dataSource.reduce((result, item) => {
                    if (result && result[this.keyExpr] === id)
                        return result;
                    else if (item[this.keyExpr] === id)
                        return item;
                    else if (item[this.itemsExpr]) {
                        let child = item[this.itemsExpr].find(el => el[this.keyExpr] == id);
                        if (child) parentId = item[this.keyExpr];
                        return child;
                    }
                }, null) : this.dataSource.find((val: any) => val[this.keyExpr] == id)
            );

            data && result.push(<DisplayElement>{
                item: this,
                displayValue: data.name || data.displayName,
                args: id,
                parentCode: this.itemsExpr ? parentId : data[this.parentExpr],
                sortField: id
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
                    let parentName = this.dataSource.find((val: any) => val[this.keyExpr] == x.parentCode).name;
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
        if (this.isClearAllowed) {
            if (args) {
                remove(this.value, (val: any, index: number) => {
                    if (val == args) {
                        this.selectedItems.splice(index, 1);
                        return true;
                    }
                    return false;
                });
            } else {
                this.value = [];
                this.selectedItems = [];
            }
        }
    }
}
