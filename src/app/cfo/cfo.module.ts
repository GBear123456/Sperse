import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CfoRoutingModule } from './cfo-routing.module';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { CashflowSetupComponent } from './cashflow-setup/cashflow-setup.component';
import { SetupStepComponent } from './shared/setup-steps/setup-steps.component';
import { SynchProgressComponent } from './shared/synch-progress/synch-progress.component';

import { CashflowComponent } from './cashflow/cashflow.component';
import { StatsComponent } from './stats/stats.component';
import { OperationsComponent } from './cashflow/operations/operations.component';

import { DxChartModule } from 'devextreme-angular';
import { MdTabsModule } from '@angular/material';

import {
    DxButtonModule,
    DxDataGridModule,
    DxDateBoxModule,
    DxFileUploaderModule,
    DxLoadIndicatorModule,
    DxPivotGridModule,
    DxSelectBoxModule,
    DxTemplateModule,
    DxTextBoxModule,
    DxToolbarModule,
    DxTooltipModule,
    DxValidationSummaryModule,
    DxValidatorModule,
    DxScrollViewModule
} from 'devextreme-angular';

@NgModule({
    imports: [
        CfoRoutingModule,
        CommonModule,
        AppCommonModule,

        DxButtonModule,
        DxDataGridModule,
        DxDateBoxModule,
        DxFileUploaderModule,
        DxLoadIndicatorModule,
        DxPivotGridModule,
        DxSelectBoxModule,
        DxTemplateModule,
        DxTextBoxModule,
        DxToolbarModule,
        DxTooltipModule,
        DxValidationSummaryModule,
        DxValidatorModule,
        DxScrollViewModule,

        DxChartModule,
        MdTabsModule
    ],
    declarations: [
        BankAccountsComponent,
        TransactionsComponent,
        CashflowSetupComponent,
        SetupStepComponent,
        SynchProgressComponent,

        CashflowComponent,
        OperationsComponent,
        StatsComponent
    ]
})

export class CfoModule { }
