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
import { FilterTreeListComponent } from './tree-list/tree-list.component';

import { DxTreeListModule } from 'devextreme-angular/ui/tree-list';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxRangeSliderModule } from 'devextreme-angular/ui/range-slider';

import { BankAccountsCommonModule } from '@shared/cfo/bank-accounts/bank-accounts-common.module';
import { BankAccountFilterComponent } from 'shared/filters/bank-account-filter/bank-account-filter.component';
import { FilterRangeComponent } from '@shared/filters/range/filter-range.component';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        CommonModule,
        FormsModule,
        BankAccountsCommonModule.forRoot(),

        DxCheckBoxModule,
        DxSelectBoxModule,
        DxTextBoxModule,
        DxDateBoxModule,
        DxDropDownBoxModule,
        DxDataGridModule,
        DxTreeListModule,
        DxTreeViewModule,
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
        FilterTreeListComponent,
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
        FilterTreeListComponent,
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
