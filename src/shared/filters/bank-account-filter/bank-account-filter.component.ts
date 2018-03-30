import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterComponent } from '../models/filter-component';

@Component({
    templateUrl: './bank-account-filter.component.html',
    styleUrls: ['./bank-account-filter.component.less']
})
export class BankAccountFilterComponent extends AppComponentBase implements OnInit, FilterComponent {
    items: {};
    apply: (event) => void;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {
    }
}
