import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FilterComponent } from '@shared/filters/models/filter-component';
import { SubscriptionsFilterModel } from '@app/crm/shared/filters/subscriptions-filter/subscriptions-filter.model';

@Component({
    templateUrl: './subscriptions-filter.component.html',
    styleUrls: ['./subscriptions-filter.component.less']
})
export class SubscriptionsFilterComponent implements FilterComponent {
    items: {
        element: SubscriptionsFilterModel
    };
    apply: (event) => void;

    constructor(
        public ls: AppLocalizationService
    ) {}

    checkSetInitialValue(event, cell, type) {
        if (!cell.row.node.children.some(level => level.data[type])
            && event.component.option('value') == undefined
        ) event.component.option('value', false);
    }

    onValueChanged(event, cell, type) {
        if (!event.event)
            return;

        let parent = cell.row.node.parent,
            children = cell.row.node.children;
        if (parent.level < 0) {
            this.setProductValue(cell.data.id, type, event.value);
            children.forEach(item => {
                item.data[type] = event.value;
                this.setLevelValue(item.data.id, cell.data.id, type, event.value);
            });
        } else if (parent.data) {
            this.setLevelValue(cell.data.id, parent.data.id, type, event.value);
            children = cell.row.node.parent.children;
            let selectedCount = children.filter(item => item.data[type]).length;
            parent.data[type] = selectedCount == children.length
                || (selectedCount ? undefined : false);
            this.setProductValue(parent.data.id, type, parent.data[type]);
        }
    }

    setProductValue(id: number, type: string, value: boolean) {
        this.items.element.dataSource.some(product => {
            if (product.id == id) {
                product[type] = value;
                return true;
            }
        });
    }

    setLevelValue(id: number, productId: number, type: string, value: boolean) {
        this.items.element.dataSource.some(product => {
            if (product.id == productId) {
                product.serviceProductLevels.some(level => {
                    if (level.id == id) {
                        level[type] = value;
                        return true;
                    }
                });
                return true;
            }
        });
    }

    onOptionChanged(event) {
        if (event.name == 'dataSource')
            this.items.element.dataSource.forEach(parent => {
                parent.uid = parent.id;
                parent.serviceProductLevels.forEach(child => {
                    child.uid = parent.id + ':' + child.id;
                });
            });
    }
}