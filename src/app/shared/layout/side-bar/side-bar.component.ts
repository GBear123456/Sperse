/** Core imports */
import { Component, ElementRef, OnDestroy } from '@angular/core';

/** Third party imports */
import capitalize from 'underscore.string/capitalize';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { DisplayElement } from '@shared/filters/models/filter-item.model';
import { Router, NavigationStart } from '@angular/router';
import { AppService } from '@app/app.service';

@Component({
    templateUrl: './side-bar.component.html',
    styleUrls: [
        '../../../../shared/common/styles/close-button.less',
        './side-bar.component.less'
    ],
    selector: 'side-bar',
    host: {
        '(document:click)': 'hideFilterDialog($event)',
        '(mouseover)': 'preventFilterDisable()',
        '(mouseout)': 'checkFilterDisable($event)',
        '(mousedown)': 'mouseDown($event)',
        '(document:mouseup)': 'mouseUp()'
    }
})
export class SideBarComponent implements OnDestroy {
    filters: FilterModel[] = [];
    activeFilter: FilterModel;
    disableFilterScroll: boolean;
    capitalize = capitalize;
    destroy$: Subject<null> = new Subject<null>();
    tooltipVisible = false;
    toolbarIsHidden$: Observable<boolean> = this.appService.toolbarIsHidden$;
    isScrolling = false;

    constructor(
        private eref: ElementRef,
        private appService: AppService,
        private filtersService: FiltersService,
        public ls: AppLocalizationService,
        public router: Router
    ) {
        filtersService.update(filters => {
            this.filters = filters;
        });
        filtersService.apply(() => {
            this.filters.forEach((filter: FilterModel) => filter.updateCaptions());
        }, true);

        router.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
            if (event instanceof NavigationStart) {
                const prevUrl = this.router.url.split('?')[0];
                const newUrl = event.url.split('?')[0];
                if (newUrl !== prevUrl) {
                    this.filters = [];
                }
            }
        });

        this.filtersService.filterToggle$.pipe(takeUntil(this.destroy$)).subscribe(enabled => {
            enabled || this.appService.toolbarRefresh();
        });
    }

    get activeFilterTip() {
        return this.activeFilter && this.activeFilter.items && this.activeFilter.items.element && this.activeFilter.items.element.tip;
    }

    toggleTooltip() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    excludeFilter(event, filter: FilterModel, displayElement: DisplayElement) {
        filter.displayElements = undefined;
        if (displayElement.item.removeFilterItem)
            displayElement.item.removeFilterItem(filter, displayElement.args, displayElement.id);

        this.filtersService.change([filter]);
        event.stopPropagation();
    }

    clearAllFilters() {
        $('.show-all-elements').removeClass('show-all-elements');
        this.filtersService.clearAllFilters();
    }

    filterApply(event) {
        this.filtersService.change([this.activeFilter]);
        this.activeFilter = undefined;
        this.checkFilterDisable(event);
        event.stopPropagation &&
            event.stopPropagation();
    }

    showFilterDialog(event, filter: FilterModel) {
        this.activeFilter = filter;
        if (filter && filter.items && filter.items.element && filter.items.element.dispatch) {
            filter.items.element.dispatch();
        }
        this.disableFilterScroll = this.activeFilter && this.activeFilter.items &&
            Object.keys(this.activeFilter.items).some(name => 
                this.activeFilter.items[name].disableOuterScroll
            );
        event && event.stopPropagation();
    }

    closeFilters(event) {
        this.hideFilterDialog(event);
        this.filtersService.toggle();
    }

    hideFilterDialog(event) {
        let sideBar = this.eref.nativeElement.querySelector('.sidebar-filters');
        if (sideBar) {
            let rect = sideBar.getBoundingClientRect();
            if (rect.top > event.clientY || rect.bottom < event.clientY ||
                rect.left > event.clientX || rect.right < event.clientX
            )
                this.activeFilter = undefined;
        }
    }

    preventFilterDisable() {
        this.filtersService.preventDisable();
    }

    checkFilterDisable(event) {
        if (!this.filtersService.fixed
            && !this.isScrolling
            && event.composedPath().every(el => el.localName != 'filter')
        ) {
            this.filtersService.disable(() => {
                this.activeFilter = undefined;
            });
        }
    }

    itemClick(event, filter) {
        filter.showAllSelected = !filter.showAllSelected;
        let container = event.target.parentElement.previousElementSibling;

        if (filter.showAllSelected) {
            container.classList.add('show-all-elements');
            event.target.text = 'show less';
        } else {
            container.classList.remove('show-all-elements');
            event.target.text = '+' + (filter.displayElements.length - 2) + ' more';
        }
    }

    clearFilterGroup(filter: FilterModel) {
        filter.clearFilterItems();
        this.filtersService.change([filter]);
    }

    mouseDown(event) {
        if (event.target.closest('.dx-scrollable-scrollbar')) {
            this.isScrolling = true;
        }
    }

    mouseUp() {
        this.isScrolling = false;
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.filtersService.unsubscribe();
    }
}
