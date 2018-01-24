import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Route } from '@angular/router';
import { StartComponent } from './start/start.component';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { CashflowComponent } from './cashflow/cashflow.component';
import { StatsComponent } from './stats/stats.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { RulesComponent } from './rules/rules.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: 'start', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'start', component: StartComponent, data: { permission: '' } },
                    { path: 'linkaccounts', component: BankAccountsComponent, data: { permission: '' } },
                    { path: 'cashflow', component: CashflowComponent, data: { permission: '' } },
                    { path: 'stats', component: StatsComponent, data: { permission: '' } },
                    { path: 'transactions', component: TransactionsComponent, data: { permission: '' } },
                    { path: 'rules', component: RulesComponent, data: { permission: '' } }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class CfoRoutingModule { }
