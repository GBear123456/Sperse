import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterComponent } from '../models/filter-component';

@Component({
    templateUrl: './filter-calendar.component.html',
    styleUrls: ['./filter-calendar.component.less']
})
export class FilterCalendarComponent extends AppComponentBase implements OnInit, FilterComponent {
    options: any;
    items: {
        from: any,
        to: any
    };
    apply: (event) => void;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {
    }
}
