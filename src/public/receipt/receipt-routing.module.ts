import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReceiptComponent } from './receipt.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: ':tenantId/:publicId',
                component: ReceiptComponent,
                canActivate: [],
                canActivateChild: []
            }
        ])
    ],
    exports: [ RouterModule ],
    providers: []
})
export class ReceiptRoutingModule {}
