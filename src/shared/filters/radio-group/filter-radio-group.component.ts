import { Component, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterComponent } from '../models/filter-component';
import { FilterRadioGroupModel } from './filter-radio-group.model';

@Component({
  templateUrl: './filter-radio-group.component.html',
	styleUrls: ['./filter-radio-group.component.less']
})
export class FilterRadioGroupComponent extends AppComponentBase implements FilterComponent {
    items: {
        element: FilterRadioGroupModel
    };
  	apply: (event) => void;
  	
    constructor(injector: Injector) {
        super(injector);
    }  
}