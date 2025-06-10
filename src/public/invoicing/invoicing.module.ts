/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { MatMenuModule } from '@angular/material/menu';

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import { InvoicingRoutingModule } from './invoicing-routing.module';
import { ReceiptComponent } from './receipt/receipt.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { UserInvoiceServiceProxy } from '@root/shared/service-proxies/service-proxies';
import { PaypalModule } from '@shared/common/paypal/paypal.module';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        CommonModule,
        MatMenuModule,
        InvoicingRoutingModule,
        PaypalModule
    ],
    exports: [],
    declarations: [
        ReceiptComponent,
        InvoiceComponent
    ],
    providers: [
        UserInvoiceServiceProxy
    ]
})
export class InvoicingModule { }
