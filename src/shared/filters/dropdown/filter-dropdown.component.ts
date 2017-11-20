import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterComponent } from '../models/filter-component';
import { FilterDropDownModel } from './filter-dropdown.model'

@Component({
    templateUrl: './filter-dropdown.component.html',
    styleUrls: ['./filter-dropdown.component.less']
})
export class FilterDropDownComponent extends AppComponentBase implements OnInit, FilterComponent {
    items: { [id: string]: FilterDropDownModel; };
    apply: (event) => void;
    value?: string;

    constructor(injector: Injector) {
        super(injector);
    }

    getItems(): string[] {
        return Object.keys(this.items);
    }

    ngOnInit(): void {
    }
}
