import { NgModule, ModuleWithProviders } from '@angular/core';

import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FiltersService } from './filters.service';

import { FilterManagerComponent, AdDirective } from './filter.manager.component';
import { FilterStatesComponent } from './states/filter-states.component';
import { FilterDropDownComponent } from './dropdown/filter-dropdown.component';
import { FilterInputsComponent } from './inputs/filter-inputs.component';
import { FilterCBoxesComponent } from './cboxes/filter-cboxes.component';
import { FilterDatesComponent } from './dates/filter-dates.component';
import { FilterMultiselectDropDownComponent } from './multiselect-dropdown/filter-multiselect-dropdown.component';

import { DxCheckBoxModule, DxSelectBoxModule, DxTextBoxModule, DxDateBoxModule, DxDropDownBoxModule, DxDataGridModule } from 'devextreme-angular';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        DxCheckBoxModule,
        DxSelectBoxModule,
        DxTextBoxModule,
        DxDateBoxModule,
        DxDropDownBoxModule,
        DxDataGridModule
    ],
    declarations: [
        FilterManagerComponent,
        FilterStatesComponent,
        FilterDropDownComponent,
        FilterMultiselectDropDownComponent,
        FilterInputsComponent,
        FilterCBoxesComponent,
        FilterDatesComponent,
        AdDirective
    ],
    entryComponents: [
        FilterStatesComponent,
        FilterDropDownComponent,
        FilterMultiselectDropDownComponent,
        FilterCBoxesComponent,
        FilterInputsComponent,
        FilterDatesComponent
    ],
    exports: [
        FilterManagerComponent
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
