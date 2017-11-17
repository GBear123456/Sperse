import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterComponent } from '../filter.model';

@Component({
  templateUrl: './filter-cboxes.component.html',
	styleUrls: ['./filter-cboxes.component.less']
})
export class FilterCBoxesComponent extends AppComponentBase implements OnInit, FilterComponent {
  items: {};   
	apply: (event) => void;
  selectAll: boolean;
	
  constructor(injector: Injector) {
    super(injector);
  }
  
  getItems(): string[] {
    return Object.keys(this.items);
  }

  selectAllChanged(event){
    if (event.jQueryEvent)
      for (let item in this.items)
        this.items[item].value = event.value;
  }

  updateSelectAll(event?){
    if (event && !event.jQueryEvent)
      return;

    this.selectAll = true;
    for (let item in this.items)
      this.selectAll = this.selectAll 
        && this.items[item].value;
  }

  ngOnInit(): void {
    this.updateSelectAll();
  }
}
