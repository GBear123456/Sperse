import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
//import { CommonModule } from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { CfoRoutingModule } from './cfo-routing.module';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { CashflowSetupComponent } from './cashflow-setup/cashflow-setup.component';
import { SetupStepComponent } from './shared/setup-steps/setup-steps.component';
import { SynchProgressComponent } from './shared/synch-progress/synch-progress.component';

import { ModalModule } from 'ngx-bootstrap';

import { RuleDialogComponent } from './rules/rule-edit-dialog/rule-edit-dialog.component';

import { CashflowComponent } from './cashflow/cashflow.component';
import { UserGridPreferencesComponent } from './cashflow/user-grid-preferences/user-grid-preferences.component';
import { StatsComponent } from './stats/stats.component';
import { OperationsComponent } from './cashflow/operations/operations.component';

import { DxChartModule } from 'devextreme-angular';
import { MdTabsModule } from '@angular/material';

import {
    DxButtonModule,
    DxCheckBoxModule,
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
        ngCommon.CommonModule,
        CommonModule,
        AppCommonModule,

        DxButtonModule,
        DxCheckBoxModule,
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
        ModalModule.forRoot(),

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
        UserGridPreferencesComponent,
        StatsComponent,
        RuleDialogComponent
    ],
    entryComponents: [
        RuleDialogComponent
    ]
})

export class CfoModule { }
