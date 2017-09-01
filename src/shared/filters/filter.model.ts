import { Type } from '@angular/core';

export interface FilterComponent {
  items?: object;
  apply: (event) => void;
}

export class FilterModel {
  component: Type<any>;
  operator: string;
  caption: string;  
  items?: object;
  query?: Array<string>[];
}