/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import { ReceiptRoutingModule } from './receipt-routing.module';
import { ReceiptComponent } from './receipt.component';
import { UserInvoiceServiceProxy } from '@root/shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        ngCommon.CommonModule,
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
