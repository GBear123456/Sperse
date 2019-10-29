import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import sortBy from 'lodash/sortBy';
import remove from 'lodash/remove';
import DevExpress from 'devextreme/bundles/dx.all';

export class FilterStatesModel extends FilterItemModel {
    list: DevExpress.ui.dxTreeViewNode[];

    getDisplayElements(): DisplayElement[] {
        let displayedElements: DisplayElement[] = [];
        this.value && this.value.map((selectedCode: string) => {
            const [ countryCode, stateCode ] = selectedCode.split(':');
            let itemData, parentData;
            parentData = itemData = this.list.find((val: DevExpress.ui.dxTreeViewNode) => val.key === countryCode);
            if (itemData && stateCode) {
                itemData = itemData.children.find((val: DevExpress.ui.dxTreeViewNode) => val.key === selectedCode);
            }
            if (itemData) {
                let parentName = itemData.parent ? parentData.text : null;
                let sortField = parentName ? parentName + ':' : '';
                sortField += itemData.text;
                displayedElements.push(<DisplayElement>{
                    item: this,
                    displayValue: itemData.text,
                    args: selectedCode,
                    parentCode: itemData.parent ? itemData.parent.key : null,
                    parentName: parentName,
                    sortField: sortField
                });
            }
        });

        displayedElements = this.generateParents(
            sortBy(displayedElements, 'sortField')
        );
        return displayedElements;
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (args)
            remove(this.value, (val: any) => val == args);
        else
            this.value = [];
    }

    private generateParents(displayedElements: DisplayElement[]): DisplayElement[] {
        let parents: DisplayElement[] = [];
        displayedElements.forEach((displayedElement: DisplayElement) => {
            if (displayedElement.parentCode) {
                let parent = parents.find(y => y.args == displayedElement.parentCode);
                if (!parent) {
                    parents.push(<DisplayElement>{
                        displayValue: displayedElement.parentName,
                        readonly: true,
                        args: displayedElement.parentCode
                    });
                }
                parents.push(displayedElement);
            } else {
                parents.push(displayedElement);
            }
        });

        return parents;
    }
}
