import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { StickyModule } from 'ng2-sticky-kit/ng2-sticky-kit';
import { MatDialogModule, MatStepperModule } from '@angular/material';
import { BankAccountsCommonModule } from '@shared/cfo/bank-accounts/bank-accounts-common.module';

import { MemberAreaRoutingModule } from './member-area-routing.module';
import { CreditReportModule } from './credit-report/credit-report.module';
import { CreditSimulatorModule } from './credit-simulator/credit-simulator.module';
import { CreditResourcesModule } from './credit-resources/credit-resources.module';

import { AccountsComponent } from './accounts/accounts.component';
import { FinancePageComponent } from './accounts/finance-page/finance-page.component';
import { MemberAreaComponent } from './member-area.component';

import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { BankAccountsGeneralService } from '@shared/cfo/bank-accounts/helpers/bank-accounts-general.service';
import { InstanceServiceProxy } from '@shared/service-proxies/service-proxies';
import { AccountConnectorDialogModule } from '@shared/common/account-connector-dialog/account-connector-dialog.module';
import { PfmIntroComponent } from '@root/personal-finance/shared/pfm-intro/pfm-intro.component';

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
        AccountConnectorDialogModule,
        StickyModule,
        MatStepperModule,
        MatDialogModule
    ],
    declarations: [
        MemberAreaComponent,
        AccountsComponent,
        FinancePageComponent,
        PfmIntroComponent
    ],
    providers: [
        InstanceServiceProxy,
        SynchProgressService,
        BankAccountsGeneralService
    ],
    entryComponents: [
        PfmIntroComponent
    ]
})
export class MemberAreaModule {
}
