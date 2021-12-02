import { Component, AfterViewInit } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { FilterComponent } from '@shared/filters/models/filter-component';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { LayoutType } from '@shared/service-proxies/service-proxies';

@Component({
    templateUrl: './services-and-products-filter.component.html',
    styleUrls: ['./services-and-products-filter.component.less']
})
export class FilterServicesAndProductsComponent implements FilterComponent, AfterViewInit {
    items: {
        services: FilterCheckBoxesModel,
        products:  FilterCheckBoxesModel
    };
    apply: (event) => void;
    activated: boolean;

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

    constructor(
        public ls: AppLocalizationService,
        public userManagementService: UserManagementService
    ) {}

    ngAfterViewInit() {
        if (this.items) {        
            let services = this.items.services && this.items.services['selectedItems'],
                products = this.items.products && this.items.products['selectedItems'];
            if (products && products.length > 1)
                this.selectedTabIndex = this.PRODUCTS_TAB_INDEX;
            else if (services && services.length > 0)
                this.selectedTabIndex = this.SERVICES_TAB_INDEX;
        }
    }

    onInitialized(event) {
        this.activated = true;
    }

    onDisposing(event) {
        this.activated = false;
    }

    onSelectionChanged(event) {
        setTimeout(() => {
            if (this.activated) {
                let field = this.filterTabs[this.selectedTabIndex].field;
                this.items[field].value = event.component.getSelectedRowKeys('all').filter(
                    (item, index, list) => {
                        let isDuplicate = list.indexOf(item, index + 1) == -1;
                        if (isNaN(item) || !this.items[field].itemsExpr)
                            return isDuplicate;
                        else {  
                            let node = event.component.getNodeByKey(item),
                                children = node[this.items[field].itemsExpr];
                            return (!children || !children.length) && isDuplicate;
                        }
                    }
                );
                this.items[field].selectedItems = event.component.getSelectedRowsData('all').filter(
                    (item, index, list) => list.indexOf(item, index + 1) == -1
                );
            }
        });
    }
}