/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';

/** Application imports */
import { StaticTreeViewComponent } from './static-tree-view.component';

@NgModule({
    imports: [
        CommonModule,
        DxTooltipModule,
        DxTextBoxModule,
        DxTreeViewModule,
        DxButtonModule,
        DxTabsModule
    ],
    exports: [StaticTreeViewComponent ],
    declarations: [StaticTreeViewComponent ]
})
export class StaticTreeViewModule {}