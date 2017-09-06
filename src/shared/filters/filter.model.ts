import { Type } from '@angular/core';

export interface FilterComponent {
  items?: object;
  apply: (event) => void;
}

export class FilterModel {
  component: Type<any>;
  operator: any;
  caption: string;  
  value?: string;
  field?: any;
  items?: any;
}