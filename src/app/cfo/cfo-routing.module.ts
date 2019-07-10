import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StartComponent } from './start/start.component';
import { BankAccountsGeneralComponent } from './bank-accounts-general/bank-accounts-general.component';
import { BankAccountsComponent } from '@shared/cfo/bank-accounts/bank-accounts.component';
import { BankAccountsQuovoComponent } from '@shared/cfo/bank-accounts/bank-accounts-quovo/bank-accounts-quovo.component';
import { QuovoPfmComponent } from '@shared/cfo/bank-accounts/quovo-pfm/quovo-pfm.component';
import { CashflowComponent } from './cashflow/cashflow.component';
import { StatsComponent } from './stats/stats.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { RulesComponent } from './rules/rules.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { BusinessEntitiesComponent } from './business-entities/business-entities.component';
import { ChartOfAccountsComponent } from 'app/cfo/chart-of-accounts/chart-of-accounts.component';
import { StatementsComponent } from './statements/statements.component';
import { CfoInstanceStatusGuard } from '@app/cfo/cfo-instance-status-guard';
import { ReportsComponent } from './reports/reports.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', redirectTo: 'start', pathMatch: 'full' },
            {
                path: '',
                children: [
                    { path: 'start', component: StartComponent, data: { permission: '', reuse: true } },
                    {
                        path: 'linkaccounts',
                        data: { permission: '', reuse: true },
                        component: BankAccountsGeneralComponent,
                        children: [
                            {
                                path: '',
                                component: BankAccountsComponent,
                                data: { permission: '' },
                            },
                            {
                                path: 'quovo',
                                component: BankAccountsQuovoComponent
                            },
                            {
                                path: 'pfm',
                                component: QuovoPfmComponent
                            }
                        ]
                    },
                    {
                        path: 'business-entities',
                        component: BusinessEntitiesComponent,
                        data: { permission: '' },
                        canActivate: [ CfoInstanceStatusGuard ]
                    },
                    {
                        path: 'chart-of-accounts',
                        component: ChartOfAccountsComponent,
                        data: { permission: '' },
                        canActivate: [ CfoInstanceStatusGuard ]
                    },
                    { path: 'cashflow', component: CashflowComponent, data: { permission: '', reuse: true } },
                    { path: 'stats', component: StatsComponent, data: { permission: '', reuse: true } },
                    { path: 'transactions', component: TransactionsComponent, data: { permission: '', reuse: true } },
                    { path: 'rules', component: RulesComponent, data: { permission: '' } },
                    { path: 'permissions', component: PermissionsComponent, data: { permission: '' } },
                    { path: 'statements', component: StatementsComponent, data: { permission: '', reuse: true } },
                    { path: 'reports', component: ReportsComponent, data: { permission: '', reuse: true } }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ],
    providers: [
        CfoInstanceStatusGuard
    ]
})
export class CfoRoutingModule { }
