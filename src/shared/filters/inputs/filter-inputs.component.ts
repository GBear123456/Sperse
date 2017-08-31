import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  templateUrl: './filter-inputs.component.html',
	styleUrls: ['./filter-inputs.component.less']
})
export class FilterInputsComponent extends AppComponentBase implements OnInit {
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