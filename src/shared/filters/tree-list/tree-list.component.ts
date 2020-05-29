/** Core imports */
import { Component } from '@angular/core';

/** Third party imports */
import * as _ from 'underscore';

/** Application imports */
import { FilterComponent } from '../models/filter-component';
import { FilterTreeListModel } from './tree-list.model';

@Component({
    templateUrl: './tree-list.component.html',
    styleUrls: ['./tree-list.component.less']
})
export class FilterTreeListComponent implements FilterComponent {
    items: {
        element: FilterTreeListModel
    };
    component: any;
    apply: (event) => void;

    onSelect($event) {
        this.items.element.value = _.union(_.difference(
            this.items.element.value, $event.currentDeselectedRowKeys),
            $event.currentSelectedRowKeys
        );
    }

    onInitialized($event) {
        this.component = $event.component;
        this.applySelectedRowKeys();
    }

    applySelectedRowKeys() {
        this.component.option(
            'selectedRowKeys', this.items.element.value
        );
    }
}
