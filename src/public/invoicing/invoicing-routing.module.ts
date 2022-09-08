import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReceiptComponent } from './receipt/receipt.component';
import { InvoiceComponent } from './invoice/invoice.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: ':tenantId/:publicId',
                component: ReceiptComponent,
                canActivate: [],
                canActivateChild: []
            },
            {
                path: 'invoice/:tenantId/:publicId',
                component: InvoiceComponent,
                canActivate: [],
                canActivateChild: []
            }
        ])
    ],
    exports: [ RouterModule ],
    providers: []
})
export class InvoicingRoutingModule {}
