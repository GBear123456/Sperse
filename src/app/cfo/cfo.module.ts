import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { AppCommonModule } from '../shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { CfoRoutingModule } from './cfo-routing.module';
import { StartComponent } from './start/start.component';
import { SetupComponent } from './start/setup/setup.component';
import { DashboardComponent } from './start/dashboard/dashboard.component';
import { BankAccountsComponent } from './bank-accounts/bank-accounts.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { CategorizationComponent } from './transactions/categorization/categorization.component';
import { SetupStepComponent } from './shared/setup-steps/setup-steps.component';
import { SynchProgressComponent } from './shared/synch-progress/synch-progress.component';

import { ModalModule } from 'ngx-bootstrap';

import { RulesComponent } from './rules/rules.component';
import { RuleDialogComponent } from './rules/rule-edit-dialog/rule-edit-dialog.component';
import { CategoryDeleteDialogComponent } from './transactions/categorization/category-delete-dialog/category-delete-dialog.component';

import { CashflowComponent } from './cashflow/cashflow.component';
import { PreferencesDialogComponent } from './cashflow/preferences-dialog/preferences-dialog.component';
import { NoDataComponent } from './shared/common/no-data/no-data.component';
import { StatsComponent } from './stats/stats.component';
import { SourceDataComponent } from './stats/source-data/source-data.component';
import { OperationsComponent } from './cashflow/operations/operations.component';

import { MatTabsModule, MatDialogModule } from '@angular/material';

import { SortingComponent } from '@app/cfo/shared/common/sorting/sorting.component';

import { CFOService } from './cfo.service';
import { InstanceServiceProxy } from '@shared/service-proxies/service-proxies';

import {
    DxButtonModule,
    DxCheckBoxModule,
    DxDataGridModule,
    DxDateBoxModule,
    DxDropDownBoxModule,
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
    DxTreeListModule,
    DxTreeViewModule
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
        DxDropDownBoxModule,
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
        DxTreeViewModule,
        DxRadioGroupModule,
        ModalModule.forRoot(),
        DxChartModule,
        MatTabsModule,
        MatDialogModule
    ],
    declarations: [
        StartComponent,
        SetupComponent,
        DashboardComponent,
        BankAccountsComponent,
        TransactionsComponent,
        CategorizationComponent,
        SetupStepComponent,
        SynchProgressComponent,
        CashflowComponent,
        OperationsComponent,
        PreferencesDialogComponent,
        StatsComponent,
        SourceDataComponent,
        RuleDialogComponent,
        CategoryDeleteDialogComponent,
        RulesComponent,
        SortingComponent,
        NoDataComponent
    ],
    entryComponents: [
        RuleDialogComponent,
        CategoryDeleteDialogComponent,
        PreferencesDialogComponent
    ],
    providers: [InstanceServiceProxy, CFOService]
})

export class CfoModule { }
