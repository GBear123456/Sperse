/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { Router, RoutesRecognized } from '@angular/router';

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
import { DxListModule } from 'devextreme-angular/ui/list';
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
import { filter, map } from 'rxjs/operators';
import { ImageViewerModule } from 'ng2-image-viewer';
import { InlineSVGModule } from 'ng-inline-svg';

/** Application imports */
import { ReportPeriodComponent } from '@app/cfo/shared/report-period/report-period.component';
import { AppCommonModule } from '../shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { CfoRoutingModule } from './cfo-routing.module';
import { StartComponent, AdDashboardHostDirective } from './start/start.component';
import { SetupComponent } from './start/setup/setup.component';
import { CfoIntroComponent } from './shared/cfo-intro/cfo-intro.component';
import { DashboardComponent } from './start/dashboard/dashboard.component';
import { PortalDashboardComponent } from './start/dashboard/portal-dashboard.component';
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
import { BankAccountsSelectDialogComponent } from 'app/cfo/shared/bank-accounts-select-dialog/bank-accounts-select-dialog.component';
import { CalculatorComponent } from 'app/cfo/shared/calculator-widget/calculator-widget.component';
import { TransactionDetailInfoComponent } from 'app/cfo/shared/transaction-detail-info/transaction-detail-info.component';
import { CashflowComponent } from './cashflow/cashflow.component';
import { PreferencesDialogComponent } from './cashflow/preferences-dialog/preferences-dialog.component';
import { ChooseResetRulesComponent } from './transactions/choose-reset-rules/choose-reset-rules.component';
import { StatsComponent } from './stats/stats.component';
import { SourceDataComponent } from './stats/source-data/source-data.component';
import { OperationsComponent } from './cashflow/operations/operations.component';
import { StatementsComponent } from './statements/statements.component';
import { CashflowServiceProxy, ContactServiceProxy, SyncServiceProxy, MyFinancesServiceProxy } from '@shared/service-proxies/service-proxies';
import { DashboardWidgetsModule } from '@shared/cfo/dashboard-widgets/dashboard-widgets.module';
import { CalculatorService } from 'app/cfo/shared/calculator-widget/calculator-widget.service';
import { ImportFromQuickBooksButtonComponent } from 'app/cfo/shared/common/quickbook/import-quick-book-button/import-quick-book-button.component';
import { UsersDialogComponent } from './permissions/users-dialog/users-dialog.component';
import { SharedIntroStepsModule } from '@shared/shared-intro-steps/shared-intro-steps.module';
import { KeyPhrasesComponent } from './transactions/key-phrases/key-phrases.component';
import { AccountConnectorDialogModule } from '@shared/common/account-connector-dialog/account-connector-dialog.module';
import { CfoStoreModule } from '@app/cfo/store';
import { CurrenciesDropdownComponent } from '@app/cfo/shared/common/currencies-dropdown/currencies-dropdown.component';
import { SearchInputModule } from '@app/shared/common/search-input/search-input.module';
import { ExpandButtonModule } from '@app/shared/common/expand-button/expand-button.module';
import { SortButtonModule } from '@app/shared/common/sort-button/sort-button.module';
import { CFOService } from '@shared/cfo/cfo.service';
import { ReportsComponent } from './reports/reports.component';
import { CalendarButtonComponent } from '@app/cfo/shared/common/calendar-button/calendar-button.component';
import { SendNotificationDialogComponent } from '@app/cfo/reports/send-notification-dialog/send-notification-dialog.component';
import { GenerateReportDialogComponent } from '@app/cfo/reports/generate-report-dialog/generate-report-dialog.component';
import { SetupStepsService } from '@app/cfo/shared/common/setup-steps/setup-steps.service';

let COMPONENTS = [
    StartComponent,
    AdDashboardHostDirective,
    SetupComponent,
    CfoIntroComponent,
    DashboardComponent,
    PortalDashboardComponent,
    BankAccountsGeneralComponent,
    TransactionsComponent,
    CategorizationComponent,
    SetupStepComponent,
    CurrenciesDropdownComponent,
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
    BusinessEntitiesComponent,
    BusinessEntityEditDialogComponent,
    ChartOfAccountsComponent,
    BankAccountsSelectDialogComponent,
    ChooseResetRulesComponent,
    CalculatorComponent,
    TransactionDetailInfoComponent,
    ReportPeriodComponent,
    ImportFromQuickBooksButtonComponent,
    UsersDialogComponent,
    KeyPhrasesComponent,
    ReportsComponent,
    GenerateReportDialogComponent,
    SendNotificationDialogComponent,
    CalendarButtonComponent
];

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
        DxListModule,
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
        ImageViewerModule,
        BankAccountsCommonModule,
        SharedIntroStepsModule,
        AccountConnectorDialogModule,
        CfoStoreModule,
        SearchInputModule,
        SortButtonModule,
        ExpandButtonModule,
        InlineSVGModule
    ],
    declarations: COMPONENTS,
    exports: COMPONENTS,
    entryComponents: [
        RuleDialogComponent,
        RuleDeleteDialogComponent,
        CategoryDeleteDialogComponent,
        PreferencesDialogComponent,
        ChooseResetRulesComponent,
        BusinessEntityEditDialogComponent,
        TransactionDetailInfoComponent,
        CfoIntroComponent,
        UsersDialogComponent,
        BankAccountsSelectDialogComponent,
        GenerateReportDialogComponent,
        SendNotificationDialogComponent,
        PortalDashboardComponent,
        DashboardComponent
    ],
    providers: [
        SetupStepsService,
        CashflowServiceProxy,
        ContactServiceProxy,
        SyncServiceProxy,
        MyFinancesServiceProxy,
        CalculatorService
    ]
})

export class CfoModule {
    constructor(
        private router: Router,
        private cfoService: CFOService
    ) {
        this.router.events.pipe(
            filter(event => event instanceof RoutesRecognized),
            map(event => (event as RoutesRecognized).state.root),
            map(route => {
                while (route.firstChild)
                    route = route.firstChild;
                return route;
            }),
            filter(route => route.outlet === 'primary' &&
                this.cfoService.checkInstanceChanged(route.params)
            )
        ).subscribe();
    }
}
