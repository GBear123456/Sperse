/** Core imports */
import { Component, Injector } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import { filter } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';

/** Application imports */
import { FilterComponent } from '../models/filter-component';
import { FilterTreeListModel } from './tree-list.model';

@Component({
    templateUrl: './tree-list.component.html',
    styleUrls: ['./tree-list.component.less']
})
export class FilterTreeListComponent extends AppComponentBase implements FilterComponent {
    items: {
        element: FilterTreeListModel
    };
    component: any;
    apply: (event) => void;

    constructor(injector: Injector,
        private _cacheService: CacheService
    ) {
        super(injector);
    }

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