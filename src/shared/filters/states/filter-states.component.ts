import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterComponent } from '../filter.model';

import getCountriesInfo from 'get-countries-info';

@Component({
  templateUrl: './filter-states.component.html',
	styleUrls: ['./filter-states.component.less']
})
export class FilterStatesComponent extends AppComponentBase implements OnInit, FilterComponent {
  items: {
    countryId: string;
    stateId: string;
    ISO: any;
  };   
	apply: (event) => void;
  countries: string[] = [];
  states: string[] = [];
  country: string;
  state: string;  

  constructor(injector: Injector) {
    super(injector);

    this.countries = getCountriesInfo({}, 'name');
  }

  provinces = require('countries-provinces/data/provinces.json');
  fromCountryCode(code) {
    return this.provinces.filter((province) => {
      return province.country == code
    });
  }

  onChangeCountry(event) {
    this.states = getCountriesInfo(
      {name: event.value}, 'provinces').pop();

    this.items.ISO = getCountriesInfo(
      {name: event.value}, 'ISO').pop();
    this.items.countryId = this.items.ISO.alpha2;
  } 

  onChangeState(event) {
    if (this.fromCountryCode(this.items.countryId)
      .every((row) => {        
        if (event.value == row.name)
          this.items.stateId = row.short;        
        else
          return true;
      }
    )) 
      this.items.stateId = event.value;
  }

  ngOnInit(): void {
    if (this.items.countryId) {
      this.country = getCountriesInfo(
        {ISO: this.items.ISO.alpha3}, 'name').pop();
      this.states = getCountriesInfo(
        {name: this.country}, 'provinces').pop();
        
      if (this.items.stateId)
        if (this.fromCountryCode(this.items.countryId)
          .every((row) => {
            if (row.short == this.items.stateId)
              this.state = row.name;
            else
              return true;
          }
        ))
          this.state = this.items.stateId;
    }
  }
}