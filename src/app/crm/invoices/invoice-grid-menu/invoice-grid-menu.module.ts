/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';

/** Application imports */
import { InvoiceGridMenuComponent } from './invoice-grid-menu.component';

@NgModule({
    imports: [
        CommonModule,
        DxTooltipModule
    ],
    exports: [
        InvoiceGridMenuComponent
    ],
    declarations: [
        InvoiceGridMenuComponent
    ],
    providers: [],
})
export class InvoiceGridMenuModule { }
