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
import { SetupStepComponent } from './shared/common/setup-steps/setup-steps.component';
import { SynchProgressComponent } from './shared/common/synch-progress/synch-progress.component';

import { ModalModule } from 'ngx-bootstrap';

import { RulesComponent } from './rules/rules.component';
import { RuleDialogComponent } from './rules/rule-edit-dialog/rule-edit-dialog.component';
import { RuleDeleteDialogComponent } from './rules/rule-delete-dialog/rule-delete-dialog.component';
import { CategoryDeleteDialogComponent } from './transactions/categorization/category-delete-dialog/category-delete-dialog.component';
import { BusinessEntitiesComponent } from './business-entities/business-entities.component';

import { ChartOfAccountsComponent } from 'app/cfo/chart-of-accounts/chart-of-accounts.component';
import { BankAccountsSelectComponent } from 'app/cfo/shared/bank-accounts-select/bank-accounts-select.component';

import { CashflowComponent } from './cashflow/cashflow.component';
import { PreferencesDialogComponent } from './cashflow/preferences-dialog/preferences-dialog.component';
import { CFOModalDialogComponent } from './shared/common/dialogs/modal/cfo-modal-dialog.component';

import { StatsComponent } from './stats/stats.component';
import { SourceDataComponent } from './stats/source-data/source-data.component';
import { OperationsComponent } from './cashflow/operations/operations.component';

import { MatTabsModule, MatDialogModule } from '@angular/material';

import { SortingComponent } from '@app/cfo/shared/common/sorting/sorting.component';

import { CFOService } from './cfo.service';
import { InstanceServiceProxy, CustomersServiceProxy } from '@shared/service-proxies/service-proxies';
import { RoundProgressModule } from 'angular-svg-round-progressbar';

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
    DxTreeViewModule,
    DxProgressBarModule,
    DxTabsModule,
    DxTagBoxModule,
    DxResizableModule
} from 'devextreme-angular';
import {DashboardWidgetsModule} from '@shared/dashboard-widgets/dashboard-widgets.module';

import { ngxZendeskWebwidgetModule, ngxZendeskWebwidgetConfig, ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';

export class ZendeskConfig extends ngxZendeskWebwidgetConfig {
  accountUrl = 'sperse.zendesk.com';
  beforePageLoad(zE) {
    zE.setLocale('en');
    zE.hide();
  }
}

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
        DxProgressBarModule,
        DxRadioGroupModule,
        DxTabsModule,
        DxTagBoxModule,
        DxResizableModule,
        ModalModule.forRoot(),
        DxChartModule,
        MatTabsModule,
        MatDialogModule,
        RoundProgressModule,
        DashboardWidgetsModule,
        ngxZendeskWebwidgetModule.forRoot(ZendeskConfig)
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
        RuleDeleteDialogComponent,
        CategoryDeleteDialogComponent,
        RulesComponent,
        SortingComponent,
        CFOModalDialogComponent,
        BusinessEntitiesComponent,
        ChartOfAccountsComponent,
        BankAccountsSelectComponent
    ],
    entryComponents: [
        RuleDialogComponent,
        RuleDeleteDialogComponent,
        CategoryDeleteDialogComponent,
        PreferencesDialogComponent
    ],
    providers: [InstanceServiceProxy, CFOService, CustomersServiceProxy, ngxZendeskWebwidgetService]
})

export class CfoModule { }
