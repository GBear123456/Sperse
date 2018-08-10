import { NgModule, ModuleWithProviders } from '@angular/core';

import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CommonModule } from '@shared/common/common.module';

import { FiltersService } from './filters.service';

import { FilterManagerComponent, AdDirective } from './filter.manager.component';
import { FilterStatesComponent } from './states/filter-states.component';
import { FilterCheckBoxesComponent } from './check-boxes/filter-check-boxes.component';
import { FilterDropDownComponent } from './dropdown/filter-dropdown.component';
import { FilterInputsComponent } from './inputs/filter-inputs.component';
import { FilterCBoxesComponent } from './cboxes/filter-cboxes.component';
import { FilterDatesComponent } from './dates/filter-dates.component';
import { FilterCalendarComponent } from './calendar/filter-calendar.component';
import { FilterMultiselectDropDownComponent } from './multiselect-dropdown/filter-multiselect-dropdown.component';
import { FilterRadioGroupComponent } from './radio-group/filter-radio-group.component';

import { DxTreeListModule, DxCheckBoxModule, DxSelectBoxModule, DxTextBoxModule, DxRadioGroupModule,
    DxDateBoxModule, DxDropDownBoxModule, DxDataGridModule, DxRangeSliderModule
} from 'devextreme-angular';
import { BankAccountsCommonModule } from '@shared/cfo/bank-accounts/bank-accounts-common.module';
import { BankAccountFilterComponent } from 'shared/filters/bank-account-filter/bank-account-filter.component';
import { FilterRangeComponent } from '@shared/filters/range/filter-range.component';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        CommonModule,
        FormsModule,
        BankAccountsCommonModule,

        DxCheckBoxModule,
        DxSelectBoxModule,
        DxTextBoxModule,
        DxDateBoxModule,
        DxDropDownBoxModule,
        DxDataGridModule,
        DxTreeListModule,
        DxRadioGroupModule,
        DxRangeSliderModule
    ],
    declarations: [
        FilterManagerComponent,
        FilterStatesComponent,
        FilterCheckBoxesComponent,
        FilterDropDownComponent,
        FilterMultiselectDropDownComponent,
        FilterInputsComponent,
        FilterCBoxesComponent,
        FilterDatesComponent,
        FilterCalendarComponent,
        FilterRangeComponent,
        FilterRadioGroupComponent,
        BankAccountFilterComponent,
        AdDirective
    ],
    entryComponents: [
        FilterStatesComponent,
        FilterCheckBoxesComponent,
        FilterDropDownComponent,
        FilterMultiselectDropDownComponent,
        FilterCBoxesComponent,
        FilterInputsComponent,
        FilterDatesComponent,
        FilterCalendarComponent,
        FilterRangeComponent,
        FilterRadioGroupComponent,
        BankAccountFilterComponent
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
        };
    }
}
