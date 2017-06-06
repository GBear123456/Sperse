import { NgModule, ModuleWithProviders } from '@angular/core';

import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';


import { FiltersService } from './filters.service';
import { FilterStatusComponent } from './status/filter-status.component';

import { DxCheckBoxModule } from 'devextreme-angular';

@NgModule({
    imports: [
		ngCommon.CommonModule,
		FormsModule,

		DxCheckBoxModule
	],
    declarations: [
		FilterStatusComponent
    ],
    exports: [
		FilterStatusComponent
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