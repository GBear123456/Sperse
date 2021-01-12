import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeZoneComboComponent } from './timezone-combo.component';

@NgModule({
    imports: [ CommonModule, FormsModule ],
    exports: [ TimeZoneComboComponent ],
    declarations: [ TimeZoneComboComponent ],
    providers: [],
})
export class TimeZoneComboModule {}