import { Component, AfterViewInit } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FilterComponent } from '@shared/filters/models/filter-component';
import { SubscriptionsFilterModel } from '@app/crm/shared/filters/subscriptions-filter/subscriptions-filter.model';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { LayoutType } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './subscriptions-filter.component.html',
    styleUrls: ['./subscriptions-filter.component.less']
})
export class SubscriptionsFilterComponent implements FilterComponent, AfterViewInit {
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

    private readonly SERVICES_TAB_INDEX = 0;
    private readonly PRODUCTS_TAB_INDEX = 1;

    selectedTabIndex = this.PRODUCTS_TAB_INDEX;
    showFilterTabs = this.userManagementService.isLayout(LayoutType.BankCode);
    isLoaded = false;

    constructor(
        public ls: AppLocalizationService,
        public userManagementService: UserManagementService
    ) { }

    ngAfterViewInit() {
        if (this.items) {
            let services = this.items.services && this.items.services['getObjectValue'](),
                products = this.items.products && this.items.products['getObjectValue']();
            if (products && Object.keys(products).length > 1)
                this.selectedTabIndex = this.PRODUCTS_TAB_INDEX;
            else if (services && Object.keys(services).length > 0)
                this.selectedTabIndex = this.SERVICES_TAB_INDEX;
        }
    }

    checkSetInitialValue(event, cell, type) {
        if (!cell.row.node.children.some(level => level.data[type])
            && event.component.option('value') == undefined
        ) event.component.option('value', false);
    }

    onTabClick(event) {
        this.isLoaded = false;
        this.selectedTabIndex = event.itemIndex;
    }

    onContentReady() {
        this.isLoaded = true;
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
                this.setLevelValue(field, item.data.id, cell.data.id, type, event.value);
            });
        } else if (parent.data) {
            this.setLevelValue(field, cell.data.id, parent.data.id, type, event.value);
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

    setLevelValue(field: string, id: number, productId: number, type: string, value: boolean) {
        this.items[field].dataSource.some(product => {
            if (product.id == productId) {
                product[this.items[field].itemsExpr].some(level => {
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