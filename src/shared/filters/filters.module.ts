import { NgModule, ModuleWithProviders } from '@angular/core';

import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';


import { FiltersService } from './filters.service';

import { FilterComponentManager, AdDirective } from './filter.component';
import { FilterStatesComponent } from './states/filter-states.component';

import { DxCheckBoxModule, DxSelectBoxModule } from 'devextreme-angular';

@NgModule({
  imports: [
		ngCommon.CommonModule,
		FormsModule,

		DxCheckBoxModule,
    DxSelectBoxModule
	],
  declarations: [
    FilterComponentManager,
		FilterStatesComponent,
    AdDirective
  ],
  entryComponents: [
    FilterStatesComponent
  ],
  exports: [
		FilterComponentManager
  ]
})
export class FiltersModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: FiltersModule,
      providers: [
        FiltersService
      ]
    }
  }
}