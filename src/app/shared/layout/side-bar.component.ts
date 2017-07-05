import { Component, Injector, ElementRef } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { FiltersService } from '@shared/filters/filters.service';
import { Router, NavigationStart  } from '@angular/router';

@Component({
    templateUrl: './side-bar.component.html',
	styleUrls: ['./side-bar.component.less'],
    selector: 'side-bar',
	host: {
    	'(document:click)': "showFilterDialog($event)"
  	},
})
export class SideBarComponent extends AppComponentBase {
	filters: Object[] = [];
	activeFilter: String = '';

    constructor(
		private _eref: ElementRef, 
		private _filtersService: FiltersService,
		injector: Injector,
		router: Router,
		private _appSessionService: AppSessionService
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

	showFilterDialog(event, type) {
		if (this._eref.nativeElement.contains(event.target)) {
			type && (this.activeFilter = type);
			event.stopPropagation();
		} else 
			this.activeFilter = type;	
	}

/*
	filterBy(event) {
	}
*/
}