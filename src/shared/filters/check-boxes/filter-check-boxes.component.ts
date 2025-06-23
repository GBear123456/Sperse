<<<<<<< HEAD
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
        setTimeout(() => {
            if (this.activated) {
                this.items.element.value = event.selectedRowKeys;
                this.items.element.selectedItems = event.selectedRowsData;
            }
        });
    }
=======
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
        setTimeout(() => {
            if (this.activated) {
                this.items.element.value = event.selectedRowKeys;
                this.items.element.selectedItems = event.selectedRowsData;
            }
        });
    }
>>>>>>> f999b481882149d107812286d0979872df712626
}