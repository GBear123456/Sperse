/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { AngularGooglePlaceModule } from 'angular-google-place';
import { RoundProgressModule } from 'angular-svg-round-progressbar';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxDropDownBoxModule } from 'devextreme-angular/ui/drop-down-box';
import { DxFileUploaderModule } from 'devextreme-angular/ui/file-uploader';
import { DxPivotGridModule } from 'devextreme-angular/ui/pivot-grid';
import { DxTemplateModule } from 'devextreme-angular/core/template';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxToolbarModule } from 'devextreme-angular/ui/toolbar';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxValidationSummaryModule } from 'devextreme-angular/ui/validation-summary';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxRadioGroupModule } from 'devextreme-angular/ui/radio-group';
import { DxTreeListModule } from 'devextreme-angular/ui/tree-list';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxProgressBarModule } from 'devextreme-angular/ui/progress-bar';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { DxResizableModule } from 'devextreme-angular/ui/resizable';
import { DxRangeSliderModule } from 'devextreme-angular/ui/range-slider';
import { DxSwitchModule } from 'devextreme-angular/ui/switch';
import { DxPopupModule } from 'devextreme-angular/ui/popup';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { ModalModule } from 'ngx-bootstrap';

/** Application imports */
import { LayoutService } from '@app/shared/layout/layout.service';
import { ReportPeriodComponent } from '@app/cfo/shared/report-period/report-period.component';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { CfoRoutingModule } from '@app/cfo/cfo-routing.module';
import { StartComponent } from '@app/cfo/start/start.component';
import { SetupComponent } from '@app/cfo/start/setup/setup.component';
import { CfoIntroComponent } from '@app/cfo/shared/cfo-intro/cfo-intro.component';
import { DashboardComponent } from '@app/cfo/start/dashboard/dashboard.component';
import { BankAccountsGeneralComponent } from '@app/cfo/bank-accounts-general/bank-accounts-general.component';
import { BankAccountsCommonModule } from '@shared/cfo/bank-accounts/bank-accounts-common.module';
import { TransactionsComponent } from '@app/cfo/transactions/transactions.component';
import { CategorizationComponent } from '@app/cfo/transactions/categorization/categorization.component';
import { SetupStepComponent } from '@app/cfo/shared/common/setup-steps/setup-steps.component';
import { RulesComponent } from '@app/cfo/rules/rules.component';
import { PermissionsComponent } from '@app/cfo/permissions/permissions.component';
import { RuleDialogComponent } from '@app/cfo/rules/rule-edit-dialog/rule-edit-dialog.component';
import { RuleDeleteDialogComponent } from '@app/cfo/rules/rule-delete-dialog/rule-delete-dialog.component';
import { CategoryDeleteDialogComponent } from '@app/cfo/transactions/categorization/category-delete-dialog/category-delete-dialog.component';
import { BusinessEntitiesComponent } from '@app/cfo/business-entities/business-entities.component';
import { BusinessEntityEditDialogComponent } from '@app/cfo/business-entities/business-entity-edit-dialog/business-entity-edit-dialog.component';
import { ChartOfAccountsComponent } from '@app/cfo/chart-of-accounts/chart-of-accounts.component';
import { BankAccountsSelectComponent } from '@app/cfo/shared/bank-accounts-select/bank-accounts-select.component';
import { CalculatorComponent } from '@app/cfo/shared/calculator-widget/calculator-widget.component';
import { TransactionDetailInfoComponent } from '@app/cfo/shared/transaction-detail-info/transaction-detail-info.component';
import { CashflowComponent } from '@app/cfo/cashflow/cashflow.component';
import { PreferencesDialogComponent } from '@app/cfo/cashflow/preferences-dialog/preferences-dialog.component';
import { CFOModalDialogComponent } from '@app/cfo/shared/common/dialogs/modal/cfo-modal-dialog.component';
import { ChooseResetRulesComponent } from '@app/cfo/transactions/choose-reset-rules/choose-reset-rules.component';
import { StatsComponent } from '@app/cfo/stats/stats.component';
import { SourceDataComponent } from '@app/cfo/stats/source-data/source-data.component';
import { OperationsComponent } from '@app/cfo/cashflow/operations/operations.component';
import { StatementsComponent } from '@app/cfo/statements/statements.component';
import { CashflowServiceProxy, ContactServiceProxy, SyncServiceProxy } from '@shared/service-proxies/service-proxies';
import { DashboardWidgetsModule } from '@shared/cfo/dashboard-widgets/dashboard-widgets.module';
import { CalculatorService } from '@app/cfo/shared/calculator-widget/calculator-widget.service';
import { ImportFromQuickBooksButtonComponent } from '@app/cfo/shared/common/quickbook/import-quick-book-button/import-quick-book-button.component';
import { UsersDialogComponent } from '@app/cfo/permissions/users-dialog/users-dialog.component';
import { SharedIntroStepsModule } from '@shared/shared-intro-steps/shared-intro-steps.module';
import { KeyPhrasesComponent } from '@app/cfo/transactions/key-phrases/key-phrases.component';
import { AccountConnectorDialogModule } from '@shared/common/account-connector-dialog/account-connector-dialog.module';
import { CfoStoreModule } from '@app/cfo/store';
import { CFOService } from '@shared/cfo/cfo.service';
import { UserOnlyCFOService } from '@shared/cfo/user-only.cfo.service';

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
        BankAccountsCommonModule.forRoot(),
        SharedIntroStepsModule,
        AccountConnectorDialogModule,
        CfoStoreModule
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
        TransactionDetailInfoComponent,
        CfoIntroComponent,
        UsersDialogComponent
    ],
    providers: [
        CashflowServiceProxy,
        ContactServiceProxy,
        SyncServiceProxy,
        CalculatorService,
        {
            provide: CFOService,
            useClass: UserOnlyCFOService
        }
    ]
})

export class CfoPortalModule { 
    constructor(
        private _layoutService: LayoutService
    ) {
        _layoutService.showPlatformSelectMenu = false;
    }
}