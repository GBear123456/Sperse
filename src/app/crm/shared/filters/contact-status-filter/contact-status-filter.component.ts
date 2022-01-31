import { Component, OnInit } from '@angular/core';
import { FilterComponent } from '@shared/filters/models/filter-component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FilterContactStatusModel } from './contact-status-filter.model';

@Component({
    templateUrl: './contact-status-filter.component.html',
    styleUrls: ['./contact-status-filter.component.less']
})
export class FilterContactStatusComponent implements OnInit, FilterComponent {
    items: {
        element: FilterContactStatusModel
    };
    apply: (event) => void;

    constructor(
        public ls: AppLocalizationService
    ) {}

    ngOnInit(): void {
    }
}
