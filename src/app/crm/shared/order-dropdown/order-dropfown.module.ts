/** Core imports */
import { NgModule } from '@angular/core';

/** Third party imports */
import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';

/** Application imports */
import { OrderDropdownComponent } from './order-dropdown.component';

@NgModule({
    imports: [ DxDropDownBoxModule, DxDataGridModule ],
    exports: [ OrderDropdownComponent ],
    declarations: [ OrderDropdownComponent ],
    providers: [],
})
export class OrderDropdownModule {}
