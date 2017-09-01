import { Component, Injector, ElementRef } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { FiltersService } from '@shared/filters/filters.service';
import { FilterModel } from '@shared/filters/filter.model';
import { Router, NavigationStart  } from '@angular/router';

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

	filterApply(event) {    
    this._filtersService.change(this.activeFilter);
    this.activeFilter = undefined;
	}

  hideFilterDialog(event) {
    /* !!VP need to define correct check for close */
    //if (!this._eref.nativeElement.contains(event.target)) 
    //  this.activeFilter = undefined;
  }
}