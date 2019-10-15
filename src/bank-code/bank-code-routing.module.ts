import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BankCodeExternalComponent } from './shared/bank-code-external/bank-code-external.component';
import { BankCodeComponent } from './bank-code.component';
import { DashboardComponent } from '@root/bank-code/dashboard/dashboard.component';

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
                    },
                    {
                        path: 'dashboard',
                        component: DashboardComponent
                    },
                    {
                        path: 'products',
                        loadChildren: 'bank-code/products/products.module#ProductsModule'
                    }
                ]
            }
        ])
    ],
    exports: [ RouterModule ]
})
export class BankCodeRoutingModule { }
