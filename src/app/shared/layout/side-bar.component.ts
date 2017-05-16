import { Component, Injector, ElementRef } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterMap } from './filters/filter-map';
import { Router, NavigationEnd  } from '@angular/router';

@Component({
    templateUrl: './side-bar.component.html',
	styleUrls: ['./side-bar.component.less'],
    selector: 'side-bar',
	host: {
    	'(document:click)': "showFilterDialog($event)",
  	},
})
export class SideBarComponent extends AppComponentBase {
	filters: Object[] = [];
	activeFilter: String = '';
	
    constructor(
		private _eref: ElementRef, 
		injector: Injector, 
		router: Router
	) {
        super(injector);

	    router.events.subscribe((event) => {
			if (event instanceof NavigationEnd)
				this.filters = FilterMap.resolve(event.url);
		});
    }

	showFilterDialog(event, type) {
		if (this._eref.nativeElement.contains(event.target)) {
			type && (this.activeFilter = type);
			event.stopPropagation();
		} else 
			this.activeFilter = type;	
	}

	filterBy(event) {
		//type = event.target.tagName.split('-').pop();
	}
}
