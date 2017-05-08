import { Component, Injector, ElementRef } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    templateUrl: './side-bar.component.html',
	styleUrls: ['./side-bar.component.less'],
    selector: 'side-bar',
	host: {
    	'(document:click)': "showFilterDialog($event)",
  	},
})
export class SideBarComponent extends AppComponentBase {
	filters: String[] = [
		'status', 'creation', 'name', 'type'
	];
	filterParams: Object = {}; 
	displayFilter: String = '';

    constructor(private _eref: ElementRef, injector: Injector) {
        super(injector);
    }

	showFilterDialog(event, type) {
		if (this._eref.nativeElement.contains(event.target)) {
			event.stopPropagation();
			if (type)
				this.displayFilter = type;
		} else 
			this.displayFilter = type;	
	}

	filterBy(event, type) {
	}
}
