import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  templateUrl: './filter-cboxes.component.html',
	styleUrls: ['./filter-cboxes.component.less']
})
export class FilterCBoxesComponent extends AppComponentBase implements OnInit {
  items: {};   
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
        this.items[item] = event.value;
  }

  updateSelectAll(event?){
    if (event && !event.jQueryEvent)
      return;

    this.selectAll = true;
    for (let item in this.items)
      this.selectAll = this.selectAll 
        && this.items[item];
  }

  ngOnInit(): void {
    this.updateSelectAll();
  }
}