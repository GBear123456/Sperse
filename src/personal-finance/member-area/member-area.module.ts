import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { StickyModule } from 'ng2-sticky-kit/ng2-sticky-kit';

import { BankAccountsCommonModule } from '@shared/cfo/bank-accounts/bank-accounts-common.module'
import { MemberAreaRoutingModule } from './member-area-routing.module';
import { CreditReportModule } from './credit-report/credit-report.module';
import { CreditSimulatorModule } from './credit-simulator/credit-simulator.module';
import { CreditResourcesModule } from './credit-resources/credit-resources.module';

import { AccountsComponent } from './accounts/accounts.component';
import { MemberAreaComponent } from './member-area.component';

import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { BankAccountsGeneralService } from '@shared/cfo/bank-accounts/helpers/bank-accounts-general.service';
import { CFOService } from '@shared/cfo/cfo.service';
import { UserOnlyCFOService } from '../shared/common/user-only.cfo.service';
import { InstanceServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CreditReportModule,
        MemberAreaRoutingModule,
        CreditSimulatorModule,
        CreditResourcesModule,
        BankAccountsCommonModule.forRoot(),
        StickyModule
    ],
    declarations: [
        MemberAreaComponent,
        AccountsComponent
    ],
    providers: [
        {
            provide: CFOService,
            useClass: UserOnlyCFOService
        },
        InstanceServiceProxy,
        SynchProgressService,
        BankAccountsGeneralService
    ]
})
export class MemberAreaModule {
}
