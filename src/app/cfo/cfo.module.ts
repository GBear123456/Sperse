import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CashflowModule } from './cashflow/cashflow.module';
import { CfoRoutingModule } from './cfo-routing.module';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { CashflowSetupComponent } from './cashflow-setup/cashflow-setup.component';
import { SetupStepComponent } from './shared/setup-steps/setup-steps.component';

import {
    DxDataGridModule,
    DxToolbarModule,
    DxTemplateModule,
    DxDateBoxModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxValidationSummaryModule,
    DxButtonModule,
    DxFileUploaderModule,
    DxSelectBoxModule
} from 'devextreme-angular';

@NgModule({
    imports: [
        CashflowModule,
        CfoRoutingModule,
        CommonModule,
        AppCommonModule,

        DxDataGridModule,
        DxToolbarModule,
        DxTemplateModule,
        DxDateBoxModule,
        DxTextBoxModule,
        DxValidatorModule,
        DxValidationSummaryModule,
        DxButtonModule,
        DxFileUploaderModule,
        DxSelectBoxModule,
    ],
    declarations: [
        BankAccountsComponent,
        TransactionsComponent,
        CashflowSetupComponent,
        SetupStepComponent
    ]
})

export class CfoModule { }
