import { Type } from '@angular/core';

export interface FilterComponent {
  items?: object;
  apply: () => void;
}

export class FilterModel {
  component: Type<any>;
  caption: string;
  items?: object;
}