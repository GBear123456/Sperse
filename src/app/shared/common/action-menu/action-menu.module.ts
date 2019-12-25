import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActionMenuComponent } from './action-menu.component';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';

@NgModule({
    imports: [ CommonModule, DxListModule, DxTooltipModule ],
    exports: [ ActionMenuComponent ],
    declarations: [ ActionMenuComponent ]
})
export class ActionMenuModule {}
