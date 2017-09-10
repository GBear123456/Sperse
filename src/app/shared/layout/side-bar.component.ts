import { Component, Injector, ElementRef } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/filter.model';
import { Router, NavigationStart  } from '@angular/router';

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
      this.filters = filters;
    });

    router.events.subscribe((event) => {
      if (event instanceof NavigationStart)
        this.filters = [];
    });
  }

  excludeFilter(event, filter) {
    filter.value = '';
    _.each(filter.items, (val, key) => {      
      if ((typeof(val) == 'string') || (val instanceof Date))
        filter.items[key] = '';
      else if (typeof(val) == 'boolean')
        filter.items[key] = true;        
    });
    this._filtersService.change(filter);
    event.stopPropagation();    
  }

  showSelectedFilters() {
    this.filters.forEach((filter) => {
      let isBoolValues = false;
      let values = _.values(_.mapObject(
        filter.items, (val, key) => { 
          let caption = this.capitalize(key);
          isBoolValues = typeof(val) == 'boolean';        
          return (typeof(val) == 'string') && val 
            || isBoolValues && val && caption
            || val && val['getDate'] && (caption + ': ' + 
              moment(val).format('l'));
        })
      ).filter(Boolean);
      if (!isBoolValues || (values.length 
        != _.values(filter.items).length)
      )
        filter.value = values.join(', ');
    });
  }

	filterApply(event) {    
    this.showSelectedFilters();

    this._filtersService
      .change(this.activeFilter);
    this.activeFilter = undefined;

    event.stopPropagation && 
    event.stopPropagation();    
	}  

  showFilterDialog(event, filter){
    this.activeFilter = filter;

    event.stopPropagation();
  }

  hideFilterDialog(event) {
    let sideBar = this._eref.nativeElement
      .querySelector('.sidebar-filters'); 
    if (sideBar) {    
      let rect =  sideBar.getBoundingClientRect();
      if (rect.top > event.clientY || rect.bottom < event.clientY ||
        rect.left > event.clientX || rect.right < event.clientX
      )   
        this.activeFilter = undefined;    
    }
  }
}