import { Component } from '@angular/core';
import { FilterComponent } from '../models/filter-component';
import capitalize from 'lodash/capitalize';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './filter-inputs.component.html',
    styleUrls: ['./filter-inputs.component.less']
})
export class FilterInputsComponent implements FilterComponent {
    items: {};
    apply: (event) => void;
    capitalize = capitalize;

    constructor(public ls: AppLocalizationService) {}

    getItems(): string[] {
      return Object.keys(this.items);
    }

}
