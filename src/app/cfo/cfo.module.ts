/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { MatTabsModule, MatDialogModule, MatStepperModule, MatTooltipModule } from '@angular/material';
import { AngularGooglePlaceModule } from 'angular-google-place';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import {
    DxButtonModule,
    DxCheckBoxModule,
    DxDataGridModule,
    DxDateBoxModule,
    DxDropDownBoxModule,
    DxFileUploaderModule,
    DxPivotGridModule,
    DxTemplateModule,
    DxTextBoxModule,
    DxNumberBoxModule,
    DxToolbarModule,
    DxTooltipModule,
    DxValidationSummaryModule,
    DxValidationGroupModule,
    DxValidatorModule,
    DxScrollViewModule,
    DxChartModule,
    DxRadioGroupModule,
    DxTreeListModule,
    DxTreeViewModule,
    DxProgressBarModule,
    DxTabsModule,
    DxTagBoxModule,
    DxResizableModule,
    DxRangeSliderModule,
    DxSwitchModule,
    DxPopupModule,
    DxSelectBoxModule
} from 'devextreme-angular';
import { ModalModule } from 'ngx-bootstrap';

/** Application imports */
import { ReportPeriodComponent } from '@app/cfo/shared/report-period/report-period.component';
import { ZendeskService } from '@app/shared/common/zendesk/zendesk.service';
import { AppCommonModule } from '../shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { CfoRoutingModule } from './cfo-routing.module';
import { StartComponent } from './start/start.component';
import { SetupComponent } from './start/setup/setup.component';
import { CfoIntroComponent } from './shared/cfo-intro/cfo-intro.component';
import { DashboardComponent } from './start/dashboard/dashboard.component';
import { BankAccountsGeneralComponent } from './bank-accounts-general/bank-accounts-general.component';
import { BankAccountsCommonModule } from '@shared/cfo/bank-accounts/bank-accounts-common.module';
import { TransactionsComponent } from './transactions/transactions.component';
import { CategorizationComponent } from './transactions/categorization/categorization.component';
import { SetupStepComponent } from './shared/common/setup-steps/setup-steps.component';
import { RulesComponent } from './rules/rules.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { RuleDialogComponent } from './rules/rule-edit-dialog/rule-edit-dialog.component';
import { RuleDeleteDialogComponent } from './rules/rule-delete-dialog/rule-delete-dialog.component';
import { CategoryDeleteDialogComponent } from './transactions/categorization/category-delete-dialog/category-delete-dialog.component';
import { BusinessEntitiesComponent } from './business-entities/business-entities.component';
import { BusinessEntityEditDialogComponent } from './business-entities/business-entity-edit-dialog/business-entity-edit-dialog.component';
import { ChartOfAccountsComponent } from 'app/cfo/chart-of-accounts/chart-of-accounts.component';
import { BankAccountsSelectComponent } from 'app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import { CalculatorComponent } from 'app/cfo/shared/calculator-widget/calculator-widget.component';
import { TransactionDetailInfoComponent } from 'app/cfo/shared/transaction-detail-info/transaction-detail-info.component';
import { CashflowComponent } from './cashflow/cashflow.component';
import { PreferencesDialogComponent } from './cashflow/preferences-dialog/preferences-dialog.component';
import { CFOModalDialogComponent } from './shared/common/dialogs/modal/cfo-modal-dialog.component';
import { ChooseResetRulesComponent } from './transactions/choose-reset-rules/choose-reset-rules.component';
import { StatsComponent } from './stats/stats.component';
import { SourceDataComponent } from './stats/source-data/source-data.component';
import { OperationsComponent } from './cashflow/operations/operations.component';
import { StatementsComponent } from './statements/statements.component';
import { ContactServiceProxy, SyncServiceProxy } from '@shared/service-proxies/service-proxies';
import { DashboardWidgetsModule } from '@shared/cfo/dashboard-widgets/dashboard-widgets.module';
import { CalculatorService } from 'app/cfo/shared/calculator-widget/calculator-widget.service';
import { ImportFromQuickBooksButtonComponent } from 'app/cfo/shared/common/quickbook/import-quick-book-button/import-quick-book-button.component';
import { UsersDialogComponent } from './permissions/users-dialog/users-dialog.component';
import { SharedIntroStepsModule } from '@shared/shared-intro-steps/shared-intro-steps.module';
import { KeyPhrasesComponent } from './transactions/key-phrases/key-phrases.component';

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
        DxPivotGridModule,
        DxSelectBoxModule,
        DxTemplateModule,
        DxTextBoxModule,
        DxNumberBoxModule,
        DxToolbarModule,
        DxTooltipModule,
        DxValidationSummaryModule,
        DxValidationGroupModule,
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
        MatStepperModule,
        MatTooltipModule,
        RoundProgressModule,
        DashboardWidgetsModule,
        DxRangeSliderModule,
        DxSwitchModule,
        AngularGooglePlaceModule,
        DxPopupModule,
        BankAccountsCommonModule,
        SharedIntroStepsModule
    ],
    declarations: [
        StartComponent,
        SetupComponent,
        CfoIntroComponent,
        DashboardComponent,
        BankAccountsGeneralComponent,
        TransactionsComponent,
        CategorizationComponent,
        SetupStepComponent,
        CashflowComponent,
        OperationsComponent,
        PreferencesDialogComponent,
        StatsComponent,
        SourceDataComponent,
        StatementsComponent,
        RuleDialogComponent,
        RuleDeleteDialogComponent,
        CategoryDeleteDialogComponent,
        RulesComponent,
        PermissionsComponent,
        CFOModalDialogComponent,
        BusinessEntitiesComponent,
        BusinessEntityEditDialogComponent,
        ChartOfAccountsComponent,
        BankAccountsSelectComponent,
        ChooseResetRulesComponent,
        CalculatorComponent,
        TransactionDetailInfoComponent,
        ReportPeriodComponent,
        ImportFromQuickBooksButtonComponent,
        UsersDialogComponent,
        KeyPhrasesComponent
    ],
    entryComponents: [
        RuleDialogComponent,
        RuleDeleteDialogComponent,
        CategoryDeleteDialogComponent,
        PreferencesDialogComponent,
        ChooseResetRulesComponent,
        BusinessEntityEditDialogComponent,
        CfoIntroComponent,
        UsersDialogComponent
    ],
    providers: [
        ContactServiceProxy,
        SyncServiceProxy,
        CalculatorService,
        ZendeskService
    ]
})

export class CfoModule { }
