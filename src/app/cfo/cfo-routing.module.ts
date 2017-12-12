import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Route } from '@angular/router';
import { CashflowComponent } from './cashflow/cashflow.component';
import { StatsComponent } from './stats/stats.component';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { CashflowSetupComponent } from './cashflow-setup/cashflow-setup.component';
import { RulesComponent } from './rules/rules.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: '/app/cfo/cashflow-setup', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'cashflow', component: CashflowComponent, data: { permission: '' } },
                    { path: 'stats', component: StatsComponent, data: { permission: '' } },
                    { path: 'cashflow-setup', component: CashflowSetupComponent, data: { permission: '' } },
                    { path: 'transactions', component: TransactionsComponent, data: { permission: '' } },
                    { path: 'rules', component: RulesComponent, data: { permission: '' } },
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
