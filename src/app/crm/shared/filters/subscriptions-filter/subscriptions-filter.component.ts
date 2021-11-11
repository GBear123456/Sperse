import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FilterComponent } from '@shared/filters/models/filter-component';
import { SubscriptionsFilterModel } from '@app/crm/shared/filters/subscriptions-filter/subscriptions-filter.model';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { LayoutType } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './subscriptions-filter.component.html',
    styleUrls: ['./subscriptions-filter.component.less']
})
export class SubscriptionsFilterComponent implements FilterComponent {
    items: {
        services: SubscriptionsFilterModel,
        products: SubscriptionsFilterModel
    };
    apply: (event) => void;

    filterTabs = [
        {
            text: this.ls.l('Services'),
            field: 'services'
        },
        {
            text: this.ls.l('Products'),
            field: 'products'
        }
    ];

    selectedTabIndex = 0;
    showFilterTabs = this.userManagementService.isLayout(LayoutType.BankCode);

    constructor(
        public ls: AppLocalizationService,
        public userManagementService: UserManagementService
    ) {}

    checkSetInitialValue(event, cell, type) {
        if (!cell.row.node.children.some(level => level.data[type])
            && event.component.option('value') == undefined
        ) event.component.option('value', false);
    }

    onValueChanged(field, event, cell, type) {
        if (!event.event)
            return;

        let parent = cell.row.node.parent,
            children = cell.row.node.children;
        if (parent.level < 0) {
            this.setProductValue(field, cell.data.id, type, event.value);
            children && children.forEach(item => {
                item.data[type] = event.value;
                this.setLevelValue(item.data.id, cell.data.id, type, event.value);
            });
        } else if (parent.data) {
            this.setLevelValue(cell.data.id, parent.data.id, type, event.value);
            children = parent.children;
            let selectedCount = children.filter(item => item.data[type]).length;
            parent.data[type] = selectedCount == children.length
                || (selectedCount ? undefined : false);
            this.setProductValue(field, parent.data.id, type, parent.data[type]);
        }
    }

    setProductValue(field: string, id: number, type: string, value: boolean) {
        this.items[field].dataSource.some(product => {
            if (product.id == id) {
                product[type] = value;
                return true;
            }
        });
    }

    setLevelValue(id: number, productId: number, type: string, value: boolean) {
        this.items.services.dataSource.some(product => {
            if (product.id == productId) {
                product.memberServiceLevels.some(level => {
                    if (level.id == id) {
                        level[type] = value;
                        return true;
                    }
                });
                return true;
            }
        });
    }
}