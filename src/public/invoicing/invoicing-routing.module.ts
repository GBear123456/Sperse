import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReceiptComponent } from './receipt/receipt.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { LocalizationResolver } from '@shared/common/localization-resolver';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: 'test-thank-you',
                component: ReceiptComponent,
                canActivate: [],
                canActivateChild: []
            },
            {
                path: ':tenantId/:publicId',
                component: ReceiptComponent,
                canActivate: [],
                canActivateChild: []
            },
            {
                path: 'invoice/:tenantId/:publicId',
                component: InvoiceComponent,
                canActivate: [LocalizationResolver],
                canActivateChild: [],
                data: { localizationSource: 'CRM' }
            }
        ])
    ],
    exports: [ RouterModule ],
    providers: []
})
export class InvoicingRoutingModule {}
