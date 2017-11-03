import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterComponent } from '../filter.model';
import { MultiselectDropDownElement } from './multiselect-dropdown-element'

@Component({
    templateUrl: './filter-multiselect-dropdown.component.html',
    styleUrls: ['./filter-multiselect-dropdown.component.less']
})
export class FilterMultiselectDropDownComponent extends AppComponentBase implements OnInit, FilterComponent {
    items: { [id: string]: MultiselectDropDownElement; };
    apply: (event) => void;
    value?: string;
    _gridBoxValue: any[] = []

    constructor(injector: Injector) {
        super(injector);
    }

    getItems(): string[] {
        return Object.keys(this.items);
    }

    ngOnInit(): void {
    }

    valueChanged(event) {
        if (event && !event.value)
            event.component.option("value", []);
    }
}
