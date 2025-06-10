/** Core imports */
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

/** Application imports */
import { StartComponent } from './start/start.component';
import { BankAccountsGeneralComponent } from './bank-accounts-general/bank-accounts-general.component';
import { CashflowComponent } from './cashflow/cashflow.component';
import { StatsComponent } from './stats/stats.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { RulesComponent } from './rules/rules.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { BusinessEntitiesComponent } from './business-entities/business-entities.component';
import { ChartOfAccountsComponent } from 'app/cfo/chart-of-accounts/chart-of-accounts.component';
import { InstanceUsersComponent } from './instance-users/instance-users.component';
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
                        component: BankAccountsGeneralComponent
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
                    {
                        path: 'transactions',
                        component: TransactionsComponent,
                        canActivate: [ CfoInstanceStatusGuard ],
                        data: { permission: '', reuse: true }
                    },
                    { path: 'rules', component: RulesComponent, data: { permission: '' } },
                    { path: 'permissions', component: PermissionsComponent, data: { permission: '' } },
                    { path: 'statements', component: StatementsComponent, data: { permission: '', reuse: true } },
                    { path: 'users', component: InstanceUsersComponent, data: { permission: '', reuse: true } },
                    {
                        path: 'reports',
                        component: ReportsComponent,
                        canActivate: [ CfoInstanceStatusGuard ],
                        data: { permission: '', reuse: true }
                    }
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
export class CfoRoutingModule {}
