import { Component } from '@angular/core';
import { FilterComponent } from '../models/filter-component';

@Component({
    templateUrl: './bank-account-filter.component.html',
    styleUrls: ['./bank-account-filter.component.less']
})
export class BankAccountFilterComponent implements FilterComponent {
    items: any;
    apply: (event) => void;
}
