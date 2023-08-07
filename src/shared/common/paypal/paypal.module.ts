import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PayPalComponent } from './paypal.component';

@NgModule({
    imports: [CommonModule],
    exports: [PayPalComponent],
    declarations: [PayPalComponent],
    providers: [],
})
export class PaypalModule { }
