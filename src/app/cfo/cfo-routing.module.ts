import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Route } from '@angular/router';
import { CashflowComponent } from './cashflow/components/main/cashflow.component';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: '/app/cfo/cashflow', pathMatch: 'full' },
            {
              path: '',
              children: [
                { path: 'cashflow', component: CashflowComponent , data: { permission: '' } }
              ]
            },
            {
              path: '',
              children: [
                { path: 'bank-accounts', component: BankAccountsComponent, data: { permission: '' } }
              ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class CfoRoutingModule { }
