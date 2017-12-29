import { Component, Input, Output, EventEmitter, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { SortingItemModel } from './sorting-item.model';
import { SortState } from './sort-state';

@Component({
    'selector': 'app-sorting',
    'templateUrl': './sorting.component.html',
    'styleUrls': ['./sorting.component.less']
})
export class SortingComponent {
    @Output() sortingChange: EventEmitter<any> = new EventEmitter();
    private _sortings;
    @Input()
    set sortings(sortings: SortingItemModel[]) {
        this._sortings = sortings;
        this.initSorting();
    }
    public items = [];
    public sortingIcons = {
        [SortState.NONE]: {
            icon: 'assets/common/icons/sort-icon-down.svg'
        },
        [SortState.UP]: {
            icon: 'assets/common/icons/sort-icon-up.svg'
        },
        [SortState.DOWN]: {
            icon: 'assets/common/icons/sort-icon-down.svg'
        },
    };
    public _defaultSortingOptions = {
        location: 'before',
        widget: 'dxButton',
        options: {
            icon: this.sortingIcons[SortState.NONE].icon,
            activeStateEnabled: false
        }
    };

    initSorting() {
        this.items = this._sortings.map(sorting => {
            let item = JSON.parse(JSON.stringify(this._defaultSortingOptions));
            item.options.text = sorting.text;
            item.options.name = sorting.name;
            item.options.sortBy = sorting.activeByDefault ? SortState.DOWN : SortState.NONE;
            item.options.elementAttr = { 'class': sorting.activeByDefault ? 'active' : '' };
            item.options.onClick = (e) => {
                const newSortBy = this.getNewSortByFromOld(e.component.option('sortBy'));
                /** Change sorting icon */
                e.component.option({
                    sortBy: newSortBy,
                    icon: this.sortingIcons[newSortBy].icon
                });
                /** Remove all sorting buttons classes*/
                e.element.closest('.dx-toolbar-item').siblings().find('.dx-button').removeClass('active');
                /** Toggle current button class */
                e.element.addClass('active');
                /** Emit the sorting change event */
                this.sortingChange.emit({
                    sortBy: e.component.option('name'),
                    sortByDirection: newSortBy
                });
            };
            return item;
        });
    }

    getNewSortByFromOld(sortBy: SortState) {
        let newSortBy;
        switch (sortBy) {
            case SortState.NONE: newSortBy = SortState.DOWN; break;
            case SortState.DOWN: newSortBy = SortState.UP; break;
            case SortState.UP: newSortBy = SortState.DOWN; break;
        }
        return newSortBy;
    }
}
