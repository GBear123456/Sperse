/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';

/** Application imports */
import { StaticListComponent } from './static-list.component';

@NgModule({
    imports: [
        CommonModule,
        DxTooltipModule,
        DxTextBoxModule,
        DxListModule,
        DxButtonModule,
        DxTabsModule
    ],
    exports: [ StaticListComponent ],
    declarations: [ StaticListComponent ]
})
export class StaticListModule {}