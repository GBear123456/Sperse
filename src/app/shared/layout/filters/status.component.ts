import { Component, Injector, Output, EventEmitter } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    templateUrl: './status.component.html',
	styleUrls: ['./status.component.less'],
    selector: 'filter-status'
})
export class FilterStatusComponent extends AppComponentBase {
	default: Array<Object> = [
		{name: 'active', value: true},
		{name: 'unactive', value: false}		
	];	
    current: Object = {
	};
 
	@Output() onApply = new EventEmitter();
	
    constructor(injector: Injector) {
        super(injector);
    }
/*
	@Output() activeChange :  EventEmitter<number> = new EventEmitter();         
    @Input() 
        get active(){
            return this._active; 
        }
*/
	//this.onApply.emit(event data)    	
}