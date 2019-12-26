import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BankPassHostComponent } from './bank-pass-host.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: BankPassHostComponent,
                canActivate: [],
                canActivateChild: []
            }
        ])
    ],
    exports: [ RouterModule ],
    providers: []
})
export class BankPassHostRoutingModule {}
