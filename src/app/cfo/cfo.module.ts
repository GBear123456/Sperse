/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

/** Third party imports */
import { AbpHttpInterceptor } from '@abp/abpHttpInterceptor';
import { MatTabsModule, MatDialogModule, MatStepperModule } from '@angular/material';
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
    DxSwitchModule
} from 'devextreme-angular';
import { ModalModule } from 'ngx-bootstrap';

/** Application imports */
import { BankAccountsService } from '@app/cfo/shared/helpers/bank-accounts.service';
import { ReportPeriodComponent } from '@app/cfo/shared/report-period/report-period.component';
import { AppCommonModule } from '../shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { CfoRoutingModule } from './cfo-routing.module';
import { StartComponent } from './start/start.component';
import { SetupComponent } from './start/setup/setup.component';
import { CfoIntroComponent } from './shared/cfo-intro/cfo-intro.component';
import { DashboardComponent } from './start/dashboard/dashboard.component';
import { BankAccountsGeneralComponent } from './bank-accounts-general/bank-accounts-general.component';
import { BankAccountsComponent } from './bank-accounts-general/bank-accounts/bank-accounts.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { CategorizationComponent } from './transactions/categorization/categorization.component';
import { SetupStepComponent } from './shared/common/setup-steps/setup-steps.component';
import { SynchProgressComponent } from './shared/common/synch-progress/synch-progress.component';
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
import { CFOService } from '@shared/cfo/cfo.service';
import { InstanceServiceProxy, CustomersServiceProxy, ContactServiceProxy, SyncServiceProxy } from '@shared/service-proxies/service-proxies';
import { QuovoService } from 'app/cfo/shared/common/quovo/QuovoService';
import { DashboardWidgetsModule } from '@shared/cfo/dashboard-widgets/dashboard-widgets.module';
import { CalculatorService } from 'app/cfo/shared/calculator-widget/calculator-widget.service';
import { BankAccountsQuovoComponent } from '@shared/cfo/bank-accounts-quovo/bank-accounts-quovo.component';
import { AddAccountButtonComponent } from 'app/cfo/shared/common/quovo/add-account-button/add-account-button.component';
import { ImportFromQuickBooksButtonComponent } from 'app/cfo/shared/common/quickbook/import-quick-book-button/import-quick-book-button.component';
import { UsersDialogComponent } from './permissions/users-dialog/users-dialog.component';

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
        MatStepperModule,
        RoundProgressModule,
        DashboardWidgetsModule,
        DxRangeSliderModule,
        DxSwitchModule,
        AngularGooglePlaceModule
    ],
    declarations: [
        StartComponent,
        SetupComponent,
        CfoIntroComponent,
        DashboardComponent,
        BankAccountsComponent,
        BankAccountsGeneralComponent,
        TransactionsComponent,
        CategorizationComponent,
        SetupStepComponent,
        SynchProgressComponent,
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
        BankAccountsQuovoComponent,
        AddAccountButtonComponent,
        ImportFromQuickBooksButtonComponent,
        UsersDialogComponent
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
        { provide: HTTP_INTERCEPTORS, useClass: AbpHttpInterceptor, multi: true },
        InstanceServiceProxy,
        CFOService,
        CustomersServiceProxy,
        ContactServiceProxy,
        QuovoService,
        SyncServiceProxy,
        CalculatorService,
        BankAccountsService
    ]
})

export class CfoModule { }
