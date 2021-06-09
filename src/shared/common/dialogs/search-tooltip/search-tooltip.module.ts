/** Core imports */
import * as ngCommon from '@angular/common';
import { NgModule } from '@angular/core';

/** Third party imports */
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';

/** Application imports */
import { SearchTooltipComponent } from '@shared/common/dialogs/search-tooltip/search-tooltip.component';

@NgModule({
    declarations: [
        SearchTooltipComponent
    ],
    exports: [
        SearchTooltipComponent
    ],   
    imports: [
        ngCommon.CommonModule,
        DxTooltipModule,
        DxTextBoxModule
    ]
})
export class SearchTooltipModule {}