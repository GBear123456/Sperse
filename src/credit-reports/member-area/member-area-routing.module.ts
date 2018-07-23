import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MemberAreaComponent } from './member-area.component';
import { CreditReportComponent } from './credit-report/credit-report.component';
import { CreditSimulatorComponent } from './credit-simulator/credit-simulator.component';
import { CreditResourcesComponent } from './credit-resources/credit-resources.component';
import { AccountsComponent } from './accounts/accounts.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: MemberAreaComponent,
                children: [
                    { path: '', component: CreditReportComponent },
                    { path: 'credit-simulator', component: CreditSimulatorComponent },
                    { path: 'credit-resources', component: CreditResourcesComponent },
                    { path: 'accounts', component: AccountsComponent }
                ]
            }
        ])
    ],
    exports: [
        RouterModule
    ]
})
export class MemberAreaRoutingModule { }
