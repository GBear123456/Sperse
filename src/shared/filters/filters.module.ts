import { NgModule, ModuleWithProviders } from '@angular/core';

import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';


import { FiltersService } from './filters.service';

import { FilterComponentManager, AdDirective } from './filter.component';
import { FilterStatesComponent } from './states/filter-states.component';
import { FilterInputsComponent } from './inputs/filter-inputs.component';
import { FilterCBoxesComponent } from './cboxes/filter-cboxes.component';

import { DxCheckBoxModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';

@NgModule({
  imports: [
		ngCommon.CommonModule,
		FormsModule,

		DxCheckBoxModule,
    DxSelectBoxModule,
    DxTextBoxModule
	],
  declarations: [
    FilterComponentManager,
		FilterStatesComponent,
    FilterInputsComponent,
    FilterCBoxesComponent,
    AdDirective
  ],
  entryComponents: [
    FilterStatesComponent,
    FilterCBoxesComponent,
    FilterInputsComponent
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