import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

import getCountriesInfo from 'get-countries-info';

@Component({
  templateUrl: './filter-states.component.html',
	styleUrls: ['./filter-states.component.less']
})
export class FilterStatesComponent extends AppComponentBase implements OnInit {
  items: {
    country: string;
    state: string;
  };   
  countries: string[] = [];
  states: string[] = [];
	
  constructor(injector: Injector) {
    super(injector);

    this.countries = getCountriesInfo({}, 'name');
  }

  onChangeCountry(event) {
    this.states = getCountriesInfo(
      {name: event.value}, 'provinces').pop();
  } 

  ngOnInit(): void {
    if (this.items.country)
      this.states = getCountriesInfo(
        {name: this.items.country}, 'provinces').pop();
  }
}