import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterComponent } from '../models/filter-component';
import { FilterCheckBoxesModel } from './filter-check-boxes.model';

@Component({
    templateUrl: './filter-check-boxes.component.html',
    styleUrls: ['./filter-check-boxes.component.less']
})
export class FilterCheckBoxesComponent extends AppComponentBase implements OnInit, FilterComponent {
    items: {
        element: FilterCheckBoxesModel
    };
    apply: (event) => void;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {
    }
}
