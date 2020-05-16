import { Component } from '@angular/core';
import { FilterComponent } from '../models/filter-component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FilterMultilineInputModel } from './filter-multiline-input.model';
import capitalize from 'lodash/capitalize';

@Component({
    templateUrl: './filter-multiline-input.component.html',
    styleUrls: ['./filter-multiline-input.component.less']
})
export class FilterMultilineInputComponent implements FilterComponent {
    items: {
        element: FilterMultilineInputModel;
    };
    apply: (event) => void;
    capitalize = capitalize;

    constructor(public ls: AppLocalizationService) {}
}
