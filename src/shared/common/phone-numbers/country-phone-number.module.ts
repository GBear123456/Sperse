import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountryPhoneNumberComponent } from './country-phone-number.component';
import { InternationalPhoneNumberModule } from '@root/node_modules/ngx-international-phone-number/src/phone-number.module';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        InternationalPhoneNumberModule
    ],
    exports: [
        CountryPhoneNumberComponent
    ],
    declarations: [
        CountryPhoneNumberComponent
    ],
    providers: [],
})
export class CountryPhoneNumberModule {}