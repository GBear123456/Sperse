import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { TimeZoneComboComponent } from './timezone-combo.component';

@NgModule({
    imports: [ CommonModule, FormsModule, DxSelectBoxModule ],
    exports: [ TimeZoneComboComponent ],
    declarations: [ TimeZoneComboComponent ],
    providers: [],
})
export class TimeZoneComboModule {}