import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterComponent } from '../filter.model';

@Component({
  templateUrl: './filter-calendar.component.html',
	styleUrls: ['./filter-calendar.component.less']
})
export class FilterCalendarComponent extends AppComponentBase implements OnInit, FilterComponent {
  items: {};   
	apply: (event) => void;
  
  constructor(injector: Injector) {
    super(injector);
  }
  
  getItems(): string[] {
    return Object.keys(this.items);
  }

  ngOnInit(): void {
  }
}
