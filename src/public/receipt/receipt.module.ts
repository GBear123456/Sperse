/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */

/** Application imports */
import { ReceiptRoutingModule } from './receipt-routing.module';
import { ReceiptComponent } from './receipt.component';
import { UserInvoiceServiceProxy } from '@root/shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        CommonModule,
        ReceiptRoutingModule
    ],
    exports: [],
    declarations: [ ReceiptComponent ],
    providers: [
        UserInvoiceServiceProxy
    ]
})
export class ReceiptModule {}
