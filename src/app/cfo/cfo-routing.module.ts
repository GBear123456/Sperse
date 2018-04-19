import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Route } from '@angular/router';
import { StartComponent } from './start/start.component';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { BankAccountsWidgetComponent } from '@shared/cfo/bank-accounts-widget/bank-accounts-widget.component';
import { BankAccountsQuovoComponent } from '@shared/cfo/bank-accounts-quovo/bank-accounts-quovo.component';
import { CashflowComponent } from './cashflow/cashflow.component';
import { StatsComponent } from './stats/stats.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { RulesComponent } from './rules/rules.component';
import { BusinessEntitiesComponent } from './business-entities/business-entities.component';
import { ChartOfAccountsComponent } from 'app/cfo/chart-of-accounts/chart-of-accounts.component';

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
                        component: BankAccountsComponent,
                        children: [
                            {
                                path: '',
                                component: BankAccountsWidgetComponent
                            },
                            {
                                path: 'quovo',
                                component: BankAccountsQuovoComponent
                            }
                        ]
                    },
                    { path: 'business-entities', component: BusinessEntitiesComponent, data: { permission: '' } },
                    { path: 'chart-of-accounts', component: ChartOfAccountsComponent, data: { permission: '' } },
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
