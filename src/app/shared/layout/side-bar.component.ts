import { Component, Injector, ElementRef } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/filter.model';
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
        '(document:click)': "hideFilterDialog($event)"
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
            this.showSelectedFilters();
        }, true);

        router.events.subscribe((event) => {
            if (event instanceof NavigationStart)
                this.filters = [];
        });
    }

    excludeFilter(event, filter) {
        filter.value = '';
        _.each(filter.items, (val, key) => {
            if ((typeof (val) == 'string') || (val instanceof Date))
                filter.items[key] = '';
            else if (typeof (val) == 'boolean')
                filter.items[key] = true;
            else if (filter.items[key].selectedElement)
                filter.items[key].clearSelectedElement(filter);
            else if (filter.items[key].selectedElements)
                filter.items[key].selectedElements = [];
        });
        this._filtersService.change(filter);
        event.stopPropagation();
    }

    showSelectedFilters() {
        this.filters.forEach((filter: FilterModel) => {
            let isBoolValues = false;
            let values = _.values(_.mapObject(
                filter.items, (val, key) => {
                    let caption = this.capitalize(key);
                    isBoolValues = typeof (val) == 'boolean';
                    return (typeof (val) == 'string') && val
                        || isBoolValues && val && caption
                        || val && val['getDate'] && (caption + ': ' +
                            moment(val, 'YYYY-MM-DD').format('l'))
                        || val && val.selectedElement && (val.selectedElement[val.displayElementExp] || val.displayElementExp(val.selectedElement))
                        || val && val.selectedElements && val.selectedElements.length && val.selectedElements.map(x => x[val.displayElementExp] || val.displayElementExp(x)).join("; ");
                })
            ).filter(Boolean);
            if (!isBoolValues || (values.length != _.values(filter.items).length)
            )
                filter.value = values.join(', ');
            else
                filter.value = null;
        });
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

    hideFilterDialog(event) {
        let sideBar = this._eref.nativeElement
            .querySelector('.sidebar-filters');
        if (sideBar) {
            let rect = sideBar.getBoundingClientRect();
            if (rect.top > event.clientY || rect.bottom < event.clientY ||
                rect.left > event.clientX || rect.right < event.clientX
            )
                this.activeFilter = undefined;
        }
    }
}
