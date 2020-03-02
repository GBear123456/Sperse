import { ChangeDetectorRef, Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FilterComponent } from '@shared/filters/models/filter-component';
import { SubscriptionsFilterModel } from '@app/crm/shared/filters/subscriptions-filter/subscriptions-filter.model';

@Component({
    templateUrl: './subscriptions-filter.component.html',
    styleUrls: ['./subscriptions-filter.component.less']
})
export class SubscriptionsFilterComponent implements FilterComponent {
    items: {
        element: SubscriptionsFilterModel
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
