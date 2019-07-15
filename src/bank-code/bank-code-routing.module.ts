import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BankCodeExternalComponent } from './shared/bank-code-external/bank-code-external.component';
import { BankCodeComponent } from './bank-code.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: BankCodeComponent,
                canActivate: [ ],
                canActivateChild: [ ],
                children: [
                    {
                        path: '',
                        component: BankCodeExternalComponent
                    }
                ]
            }
        ])
    ],
    exports: [ RouterModule ]
})
export class BankCodeRoutingModule { }