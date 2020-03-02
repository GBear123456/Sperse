import { ChangeDetectorRef, Component } from '@angular/core';
import { FilterComponent } from '../models/filter-component';
import { FilterMultipleCheckBoxesModel } from './filter-multiple-check-boxes.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './filter-multiple-check-boxes.component.html',
    styleUrls: ['./filter-multiple-check-boxes.component.less']
})
export class FilterMultipleCheckBoxesComponent implements FilterComponent {
    items: {
        element: FilterMultipleCheckBoxesModel
    };
    apply: (event) => void;

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    checkboxClick(e, data, oppositeCheckboxProperty: string) {
        if (e.value && data[oppositeCheckboxProperty]) {
            data[oppositeCheckboxProperty] = false;
            this.changeDetectorRef.detectChanges();
        }
    }
}
