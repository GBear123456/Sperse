import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Route } from '@angular/router';
import { StartComponent } from './start/start.component';
import { BankAccountsGeneralComponent } from './bank-accounts-general/bank-accounts-general.component';
import { BankAccountsComponent } from './bank-accounts-general/bank-accounts/bank-accounts.component';
import { BankAccountsQuovoComponent } from '@shared/cfo/bank-accounts-quovo/bank-accounts-quovo.component';
import { CashflowComponent } from './cashflow/cashflow.component';
import { StatsComponent } from './stats/stats.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { RulesComponent } from './rules/rules.component';
import { BusinessEntitiesComponent } from './business-entities/business-entities.component';
import { ChartOfAccountsComponent } from 'app/cfo/chart-of-accounts/chart-of-accounts.component';
import { StatementsComponent } from './statements/statements.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: 'start', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'start', component: StartComponent, data: { permission: '' } },
                    {
                        path: 'linkaccounts',
                        data: { permission: '' },
                        component: BankAccountsGeneralComponent,
                        children: [
                            {
                                path: '',
                                component: BankAccountsComponent
                            },
                            {
                                path: 'quovo',
                                component: BankAccountsQuovoComponent
                            }
                        ]
                    },
                    { path: 'business-entities', component: BusinessEntitiesComponent, data: { permission: '' } },
                    { path: 'chart-of-accounts', component: ChartOfAccountsComponent, data: { permission: '' } },
                    { path: 'cashflow', component: CashflowComponent, data: { permission: '', reuse: true } },
                    { path: 'stats', component: StatsComponent, data: { permission: '', reuse: true } },
                    { path: 'transactions', component: TransactionsComponent, data: { permission: '' } },
                    { path: 'rules', component: RulesComponent, data: { permission: '' } },
                    { path: 'statements', component: StatementsComponent, data: { permission: '' } }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class CfoRoutingModule { }
