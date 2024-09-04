import { Component } from '@angular/core';
import { FilterComponent } from '../models/filter-component';
import { FilterCheckBoxesModel } from './filter-check-boxes.model';

@Component({
    templateUrl: './filter-check-boxes.component.html',
    styleUrls: ['./filter-check-boxes.component.less']
})
export class FilterCheckBoxesComponent implements FilterComponent {
    activated;
    items: {
        element: FilterCheckBoxesModel
    };
    apply: (event) => void;

    onInitialized(event) {
        this.activated = true;
    }

    onDisposing(event) {
        this.activated = false;
    }

    onSelectionChanged(event) {
        let isSingleSelect = this.items.element.singleSelection;
        if (isSingleSelect && event.selectedRowKeys.length == 0 && event.currentDeselectedRowKeys.length) {
            event.component.selectRows(event.currentDeselectedRowKeys[0]);
        }
        else if (isSingleSelect && event.selectedRowKeys.length > 1) {
            event.component.deselectRows(event.selectedRowKeys[0]);
        }
        else {
            setTimeout(() => {
                if (this.activated) {
                    this.items.element.value = event.selectedRowKeys;
                    this.items.element.selectedItems = event.selectedRowsData;
                }
            });
        }
    }
}