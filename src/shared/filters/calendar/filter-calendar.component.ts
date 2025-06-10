import { Component } from '@angular/core';
import { FilterComponent } from '../models/filter-component';

@Component({
    templateUrl: './filter-calendar.component.html',
    styleUrls: ['./filter-calendar.component.less']
})
export class FilterCalendarComponent implements FilterComponent {
    options: any;
    items: {
        from: any,
        to: any
    };
    apply: (event) => void;
}
