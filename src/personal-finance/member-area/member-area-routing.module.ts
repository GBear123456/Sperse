import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MemberAreaComponent } from './member-area.component';
import { CreditReportComponent } from './credit-report/credit-report.component';
import { CreditSimulatorComponent } from './credit-simulator/credit-simulator.component';
import { CreditResourcesComponent } from './credit-resources/credit-resources.component';
import { AccountsComponent } from './accounts/accounts.component';
import { LoggedInCreditReportGuard } from '@root/personal-finance/shared/common/auth/logged-in-credit-report-guard';
import { LendspaceWelcomeComponent } from './lendspace-welcome/lendspace-welcome.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: MemberAreaComponent,
                children: [
                    {
                        path: 'home',
                        component: LendspaceWelcomeComponent,
                        data: {
                            wrapperDisabled: true
                        }
                    },
                    {
                        path: 'credit-report',
                        canActivate: [ LoggedInCreditReportGuard ],
                        component: CreditReportComponent
                    },
                    { path: 'credit-simulator', component: CreditSimulatorComponent },
                    { path: 'credit-resources', component: CreditResourcesComponent },
                    {
                        path: 'my-finances',
                        component: AccountsComponent,
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: 'my-finances/:sectionName',
                        component: AccountsComponent,
                        data: { wrapperDisabled: true }
                    },
                    {
                        path: '',
                        redirectTo: '/personal-finance/home'
                    }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ],
    providers: [ LoggedInCreditReportGuard ]
})
export class MemberAreaRoutingModule { }
