import { NgModule } from '@angular/core';
import { PhoneFormatPipe } from '@shared/common/pipes/phone-format/phone-format.pipe';

@NgModule({
    declarations: [ PhoneFormatPipe ],
    exports: [ PhoneFormatPipe ]
})
export class PhoneFormatModule {}
