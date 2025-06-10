import { Component, OnInit } from '@angular/core';
import { FilterComponent } from '../models/filter-component';
import capitalize from 'underscore.string/capitalize';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './filter-cboxes.component.html',
    styleUrls: ['./filter-cboxes.component.less']
})
export class FilterCBoxesComponent implements OnInit, FilterComponent {
    items: {};
    apply: (event) => void;
    selectAll: boolean;
    capitalize = capitalize;

    constructor(
        public ls: AppLocalizationService
    ) {}

    ngOnInit(): void {
        this.updateSelectAll();
    }

    getItems(): string[] {
        return Object.keys(this.items);
    }

    selectAllChanged(event) {
        if (event.jQueryEvent)
            for (let item in this.items)
                this.items[item].value = event.value;
    }

    updateSelectAll(event?) {
        if (event && !event.jQueryEvent)
            return;

        this.selectAll = true;
        for (let item in this.items)
            this.selectAll = this.selectAll
                && this.items[item].value;
    }
}
