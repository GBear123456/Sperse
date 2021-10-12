import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FilterCheckBoxesModel } from '@shared/filters/check-boxes/filter-check-boxes.model';
import { FilterComponent } from '@shared/filters/models/filter-component';

@Component({
    templateUrl: './services-and-products-filter.component.html',
    styleUrls: ['./services-and-products-filter.component.less']
})
export class FilterServicesAndProductsComponent implements FilterComponent {
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

    selectedTabIndex = 0;

    constructor(
        public ls: AppLocalizationService
    ) {}

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
                this.items[field].value = event.selectedRowKeys;
                this.items[field].selectedItems = event.selectedRowsData;
            }
        });
    }
}