import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterComponent } from '../models/filter-component';
import { FilterRangeModel } from './filter-range.model';

@Component({
    templateUrl: './filter-range.component.html',
    styleUrls: ['./filter-range.component.less']
})
export class FilterRangeComponent extends AppComponentBase implements OnInit, FilterComponent {
    items: {
        from: any;
        to: any;
        element: FilterRangeModel;
    };
    fromValue: any;
    toValue: any;
    apply: (event) => void;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {
        this.fromValue = this.items.from.value || this.items.element.min;
        this.toValue = this.items.to.value || this.items.element.max;
    }

    valueChanged() {
        this.items.from.value = this.fromValue;
        this.items.to.value = this.toValue;
    }
}
