import { Component } from '@angular/core';
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
        public ls: AppLocalizationService
    ) {}

    checkSetInitialValue(event) {
        if (event.component.option('value') == undefined)
            event.component.option('value', false);
    }

    onValueChanged(event, cell, type) {
        if (!event.event)
            return;

        let children = cell.row.node.children;
        if (children.length)
            children.forEach(item => {
                item.data[type] = event.value;
            });
        else if (cell.row.node.parent.data) {
            children = cell.row.node.parent.children;
            let selectedCount = children.filter(item => item.data[type]).length;
            cell.row.node.parent.data[type] = selectedCount ==
                children.length || (selectedCount ? undefined : false);
        }
    }
}