import { Component, Injector, ElementRef } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import { Router, NavigationStart } from '@angular/router';
import { AppConsts } from '@shared/AppConsts';

import { FilterDropDownModel } from '@shared/filters/dropdown/filter-dropdown.model'

import * as _ from 'underscore';
import * as moment from 'moment';

@Component({
    templateUrl: './side-bar.component.html',
    styleUrls: ['./side-bar.component.less'],
    selector: 'side-bar',
    host: {
        '(document:click)': 'hideFilterDialog($event)',
        '(mouseover)': 'preventFilterDisable($event)',
        '(mouseout)': 'checkFilterDisable($event)'
    }
})
export class SideBarComponent extends AppComponentBase {
    filters: FilterModel[] = [];
    activeFilter: FilterModel;
    appElementRef: ElementRef;

    constructor(
        private _eref: ElementRef,
        private _filtersService: FiltersService,
        private _appSessionService: AppSessionService,
        injector: Injector,
        router: Router
    ) {
        super(injector);

        _filtersService.update(filters => {
            this.localizationSourceName = _filtersService.localizationSourceName
                ? _filtersService.localizationSourceName
                : AppConsts.localization.defaultLocalizationSourceName;
            this.filters = filters;
        });
        _filtersService.apply(() => {
            this.filters.forEach((filter: FilterModel) => filter.updateCaptions());
        }, true);

        router.events.subscribe((event) => {
            if (event instanceof NavigationStart)
                this.filters = [];
        });
    }

    excludeFilter(event, filter: FilterModel, displayElement: DisplayElement) {
        filter.displayElements = undefined;
        if (displayElement.item.removeFilterItem)
            displayElement.item.removeFilterItem(filter, displayElement.args);

        this._filtersService.change(filter);
        event.stopPropagation();
    }

    clearAllFilters() {
        $('.show-all-elements').removeClass('show-all-elements');
        this._filtersService.clearAllFilters();
    }

    filterApply(event) {
        this._filtersService
            .change(this.activeFilter);
        this.activeFilter = undefined;

        event.stopPropagation &&
            event.stopPropagation();
    }

    showFilterDialog(event, filter) {
        this.activeFilter = filter;
        event.stopPropagation();
    }

    closeFilters(event) {
      this.hideFilterDialog(event);
      this._filtersService.toggle();
    }

    hideFilterDialog(event) {
        let sideBar = this._eref.nativeElement.querySelector('.sidebar-filters');
        if (sideBar) {
            let rect = sideBar.getBoundingClientRect();
            if (rect.top > event.clientY || rect.bottom < event.clientY ||
                rect.left > event.clientX || rect.right < event.clientX
            )
                this.activeFilter = undefined;
        }
    }

    preventFilterDisable($event) {
        this._filtersService.preventDisable();
    }

    checkFilterDisable($event) {
        if (!this._filtersService.fixed)
            this._filtersService.disable(() => {
                this.activeFilter = undefined;
            });
    }

    itemClick(event, filter) {
        filter.showAllSelected = !filter.showAllSelected;
        let container = $(event.target.parentElement.previousElementSibling);

        if (filter.showAllSelected) {
            container.addClass('show-all-elements');
            event.target.text = 'show less';
        } else {
            container.removeClass('show-all-elements');
            event.target.text = '+' + (filter.displayElements.length - 2) + ' more';
        }
    }
}
