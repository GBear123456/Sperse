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
import { SourceDataComponent } from './stats/source-data/source-data.component';
import { OperationsComponent } from './cashflow/operations/operations.component';

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
    DxNumberBoxModule,
    DxToolbarModule,
    DxTooltipModule,
    DxValidationSummaryModule,
    DxValidatorModule,
    DxScrollViewModule,
    DxChartModule,
    DxRadioGroupModule,
    DxTreeListModule
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
        DxNumberBoxModule,
        DxToolbarModule,
        DxTooltipModule,
        DxValidationSummaryModule,
        DxValidatorModule,
        DxScrollViewModule,
        DxTreeListModule,
        DxRadioGroupModule,
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
        SourceDataComponent,
        RuleDialogComponent
    ],
    entryComponents: [
        RuleDialogComponent
    ]
})

export class CfoModule { }
