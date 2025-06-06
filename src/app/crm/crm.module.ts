/** Core imports */
import { NgModule } from "@angular/core";
import * as ngCommon from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";

/** Third party imports */
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTabsModule } from "@angular/material/tabs";
import { MatDialogModule } from "@angular/material/dialog";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatStepperModule } from "@angular/material/stepper";
import { Store } from "@ngrx/store";
import { DxListModule } from "devextreme-angular/ui/list";
import { DxTreeListModule } from "devextreme-angular/ui/tree-list";
import { DxTooltipModule } from "devextreme-angular/ui/tooltip";
import { DxDataGridModule } from "devextreme-angular/ui/data-grid";
import { DxToolbarModule } from "devextreme-angular/ui/toolbar";
import { DxTemplateModule } from "devextreme-angular/core";
import { DxDateBoxModule } from "devextreme-angular/ui/date-box";
import { DxTextBoxModule } from "devextreme-angular/ui/text-box";
import { DxValidatorModule } from "devextreme-angular/ui/validator";
import { DxValidationSummaryModule } from "devextreme-angular/ui/validation-summary";
import { DxValidationGroupModule } from "devextreme-angular/ui/validation-group";
import { DxButtonModule } from "devextreme-angular/ui/button";
import { DxFileUploaderModule } from "devextreme-angular/ui/file-uploader";
import { DxSelectBoxModule } from "devextreme-angular/ui/select-box";
import { DxPivotGridModule } from "devextreme-angular/ui/pivot-grid";
import { DxNumberBoxModule } from "devextreme-angular/ui/number-box";
import { DxScrollViewModule } from "devextreme-angular/ui/scroll-view";
import { DxTextAreaModule } from "devextreme-angular/ui/text-area";
import { DxContextMenuModule } from "devextreme-angular/ui/context-menu";
import { DxSliderModule } from "devextreme-angular/ui/slider";
import { DxRadioGroupModule } from "devextreme-angular/ui/radio-group";
import { DxCheckBoxModule } from "devextreme-angular/ui/check-box";
import { DxTagBoxModule } from "devextreme-angular/ui/tag-box";
import { DxDropDownBoxModule } from "devextreme-angular/ui/drop-down-box";
import { DxSchedulerModule } from "devextreme-angular/ui/scheduler";
import { DxPopoverModule } from "devextreme-angular/ui/popover";
import { DxCalendarModule } from "devextreme-angular/ui/calendar";
import { DxChartModule, DxFileManagerModule } from "devextreme-angular";
import { DxPieChartModule } from "devextreme-angular";
import { FileUploadModule } from "ng2-file-upload";
import { GooglePlaceModule } from "ngx-google-places-autocomplete";
/** Application imports */
import { AppConsts } from "@shared/AppConsts";
import { AppService } from "@app/app.service";
import { AppPermissionService } from "@shared/common/auth/permission.service";
import { PipelineModule } from "@app/shared/pipeline/pipeline.module";
import { UtilsModule } from "@shared/utils/utils.module";
import { CRMDashboardWidgetsModule } from "@shared/crm/dashboard-widgets/dashboard-widgets.module";
import { CrmRoutingModule } from "./crm-routing.module";
import { ClientsComponent } from "./clients/clients.component";
import { PartnersComponent } from "./partners/partners.component";
import { WelcomeComponent } from "./welcome/welcome.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { ShortcutsComponent } from "./shortcuts/shortcuts.component";
import { DocumentsComponent } from "./documents/documents.component";
import { LeftMenuModule } from "./shared/common/left-menu/left-menu.module";
import { CommissionHistoryComponent } from "./commission-history/commission-history.component";
import { LeadsComponent } from "./leads/leads.component";
import { OrdersComponent } from "./orders/orders.component";
import { OrdersHeaderDropdownComponent } from "./orders/orders-header-dropdown/orders-header-dropdown.component";
import { InvoicesComponent } from "./invoices/invoices.component";
import { ImportLeadsComponent } from "./import-leads/import-leads.component";
import { ImportListComponent } from "./import-leads/import-list/import-list.component";
import { ImportLeadsService } from "./import-leads/import-leads.service";
import { ActivityComponent } from "./activity/activity.component";
import { BankSettingsDialogComponent } from "./shared/bank-settings-dialog/bank-settings-dialog.component";
import { CrmIntroComponent } from "./shared/crm-intro/crm-intro.component";
import { SharedIntroStepsModule } from "@shared/shared-intro-steps/shared-intro-steps.module";
import { ImportServiceProxy } from "@shared/service-proxies/service-proxies";
import { ContactsModule } from "./contacts/contacts.module";
import { AppStoreService } from "@app/store/app-store.service";
import { AppCommonModule } from "@app/shared/common/app-common.module";
import { CommonModule } from "@shared/common/common.module";
import { DataSourceService } from "@app/shared/common/data-source/data-source.service";
import { PipelinesStoreActions } from "@app/crm/store";
import { AppStore } from "@app/store";
import { SourceContactListModule } from "@shared/common/source-contact-list/source-contact-list.module";
import { CurrencySelectorModule } from "@shared/common/currency-selector/currency-selector.module";
import { LoadingSpinnerModule } from "@app/shared/common/loading-spinner/loading-spinner.module";
import { AppPermissions } from "@shared/AppPermissions";
import { BankCodeLettersModule } from "@app/shared/common/bank-code-letters/bank-code-letters.module";
import { SliceModule } from "@app/shared/common/slice/slice.module";
import { MapModule } from "@app/shared/common/slice/map/map.module";
import { OrderDropdownModule } from "@app/crm/shared/order-dropdown/order-dropfown.module";
import { ActionMenuModule } from "@app/shared/common/action-menu/action-menu.module";
import { InvoiceGridMenuModule } from "@app/crm/invoices/invoice-grid-menu/invoice-grid-menu.module";
import { ReportsComponent } from "@app/crm/reports/reports.component";
import { TypesDropdownComponent } from "@app/crm/shared/types-dropdown/types-dropdown.component";
import { LeftMenuService } from "../cfo/shared/common/left-menu/left-menu.service";
import { StaticListModule } from "../shared/common/static-list/static-list.module";
import { StaticTreeViewModule } from "../shared/common/static-tree-view/static-tree-view.module";
import { CountryPhoneNumberModule } from "@shared/common/phone-numbers/country-phone-number.module";
import { ModalDialogModule } from "@shared/common/dialogs/modal/modal-dialog.module";
import { ListsModule } from "../shared/common/lists/lists.module";
import { CalendarService } from "@app/shared/common/calendar-button/calendar.service";
import { EntityCheckListDialogComponent } from "@app/crm/shared/entity-check-list-dialog/entity-check-list-dialog.component";
import { CommissionEarningsDialogComponent } from "@app/crm/commission-history/commission-earnings-dialog/commission-earnings-dialog.component";
import { LedgerCompleteDialogComponent } from "@app/crm/commission-history/ledger-complete-dialog/ledger-complete-dialog.component";
import { LedgerHistoryDialogComponent } from "@app/crm/commission-history/ledger-history-dialog/ledger-history-dialog.component";
import { PayPalCompleteDialogComponent } from "@app/crm/commission-history/paypal-complete-dialog/paypal-complete-dialog.component";
import { RequestWithdrawalDialogComponent } from "@app/crm/commission-history/request-withdrawal-dialog/request-withdrawal-dialog.component";
import { UpdateCommissionableDialogComponent } from "@app/crm/commission-history/update-commissionable-dialog/update-commissionable-dialog.component";
import { UpdateCommissionRateDialogComponent } from "@app/crm/commission-history/update-rate-dialog/update-rate-dialog.component";
import { EditTypeItemDialogComponent } from "@app/crm/shared/types-dropdown/edit-type-item-dialog/edit-type-item-dialog.component";
import { TenantSettingsWizardModule } from "@shared/common/tenant-settings-wizard/tenant-settings-wizard.module";
import { ProductsComponent } from "./products/products.component";
import { CouponsComponent } from "./coupons/coupons.component";
import { EditTenantModule } from "@app/admin/tenants/edit-tenant-modal/edit-tenant-modal.module";
import { AddCouponDialogComponent } from "./coupons/add-coupon-dialog/add-coupon-dialog.component";
import { TenantReportsComponent } from "./tenant-reports/tenant-reports.component";
import { CrmContactGroupGuard } from "./crm-contact-group-guard";
import { ZapierModule } from "@shared/common/zapier/zapier.module";
import { LeadConversionJourneyComponent } from "./traffic-stats/lead-conversion-journey/lead-conversion-journey.component";
import { StatCardComponent } from "./traffic-stats/lead-conversion-journey/stat-card/stat-card.component";
import { LeadDetailCardComponent } from "./traffic-stats/lead-conversion-journey/lead-detail-card/lead-detail-card.component";
import { UtmParametersCardComponent } from "./traffic-stats/lead-conversion-journey/utm-parameters-card/utm-parameters-card.component";
import { LocationNetworkComponent } from "./traffic-stats/lead-conversion-journey/location-network/location-network.component";
import { DeviceSessionComponent } from "./traffic-stats/lead-conversion-journey/device-session/device-session.component";
import { CustomFieldsComponent } from "./traffic-stats/lead-conversion-journey/custom-fields/custom-fields.component";
import { UrlInfoComponent } from "./traffic-stats/lead-conversion-journey/url-info/url-info.component";
import { VisitHistoryComponent } from "./traffic-stats/lead-conversion-journey/visit-history/visit-history.component";
import { AggregateAnalyticsDashboardComponent } from "./traffic-stats/aggregate-analytics-dashboard/aggregate-analytics-dashboard.component";

import {
    LucideAngularModule,
    House,
    Users,
    TrendingUp,
    ChartColumn,
    Globe,
    Search,
    Filter,
    MapPin,
    FileText,
    Wifi,
    DollarSign,
    Target,
    User,
    Crosshair,
    Clock,
    BarChart3,
    Crown,
    Star,
    Zap,
    Award,
    BadgeDollarSign,
} from "lucide-angular";
import { AggregateAnalyticsHeaderComponent } from "./traffic-stats/aggregate-analytics-dashboard/components/header/header.component";
import { AggregateAnalyticsFiltersComponent } from "./traffic-stats/common/filters/filters.component";
import { AggregateAnalyticsDateRangeComponent } from "./traffic-stats/common/date-range/date-range.component";
import { AggregateAnalyticsSelectorComponent } from "./traffic-stats/common/site-selector/selector.component";
import { StatsCardsComponent } from "./traffic-stats/aggregate-analytics-dashboard/components/stats-cards/stats-cards.component";
import { KeywordsComponent } from "./traffic-stats/aggregate-analytics-dashboard/components/keywords/keywords.component";
import { ReferrersComponent } from "./traffic-stats/aggregate-analytics-dashboard/components/referrers/referrers.component";
import { CountriesComponent } from "./traffic-stats/aggregate-analytics-dashboard/components/countries/countries.component";
import { StatesComponent } from "./traffic-stats/aggregate-analytics-dashboard/components/states/states.component";
import { DevicesComponent } from "./traffic-stats/aggregate-analytics-dashboard/components/devices/devices.component";
import { BrowsersComponent } from "./traffic-stats/aggregate-analytics-dashboard/components/browsers/browsers.component";
import { EntryPagesComponent } from "./traffic-stats/aggregate-analytics-dashboard/components/entry-pages/entry-pages.component";
import { NetworksComponent } from "./traffic-stats/aggregate-analytics-dashboard/components/networks/networks.component";
import { IpAddressesComponent } from "./traffic-stats/aggregate-analytics-dashboard/components/ip-addresses/ip-addresses.component";
import { ConversionTrackingComponent } from "./traffic-stats/conversion-tracking/conversion-tracking.component";
import { HeaderComponent } from "./traffic-stats/conversion-tracking/components/header/header.component";
import { ConversionMetricsComponent } from "./traffic-stats/conversion-tracking/components/conversion-metrics/conversion-metrics.component";
import { TopAffiliatesComponent } from "./traffic-stats/conversion-tracking/components/top-affiliates/top-affiliates.component";
import { ConversionShareChartComponent } from "./traffic-stats/conversion-tracking/components/conversion-share-chart/conversion-share-chart.component";
import { VisitsTrendChartComponent } from "./traffic-stats/conversion-tracking/components/visits-trend-chart/visits-trend-chart.component";
import { HourlyTrafficHeatmapComponent } from "./traffic-stats/conversion-tracking/components/hourly-traffic-heatmap/hourly-traffic-heatmap.component";
import { MonthlyRevenueChartComponent } from "./traffic-stats/conversion-tracking/components/monthly-revenue-chart/monthly-revenue-chart.component";
import { ConversionTrendsChartComponent } from "./traffic-stats/conversion-tracking/components/conversion-trends-chart/conversion-trends-chart.component";
import { TrafficConversionsChartComponent } from "./traffic-stats/conversion-tracking/components/traffic-conversions-chart/traffic-conversions-chart.component";
import { TopAffiliatePerformanceComponent } from "./traffic-stats/conversion-tracking/components/top-affiliate-performance/top-affiliate-performance.component";
import { KeyMetricsPanelComponent } from "./traffic-stats/conversion-tracking/components/key-metrics-panel/key-metrics-panel.component";

@NgModule({
    imports: [
        CrmRoutingModule,
        FormsModule,
        ngCommon.CommonModule,
        CommonModule,
        AppCommonModule,
        DxDropDownBoxModule,
        DxTreeListModule,
        DxDataGridModule,
        DxPivotGridModule,
        DxToolbarModule,
        DxTemplateModule,
        DxDateBoxModule,
        DxTextBoxModule,
        DxValidatorModule,
        DxValidationGroupModule,
        DxValidationSummaryModule,
        DxButtonModule,
        DxFileUploaderModule,
        DxSelectBoxModule,
        DxNumberBoxModule,
        DxScrollViewModule,
        DxTextAreaModule,
        DxContextMenuModule,
        DxTooltipModule,
        DxListModule,
        DxSliderModule,
        DxRadioGroupModule,
        DxCheckBoxModule,
        DxTagBoxModule,
        DxSchedulerModule,
        DxPopoverModule,
        DxCalendarModule,
        DxFileManagerModule,
        DxPieChartModule,
        DxChartModule,
        ReactiveFormsModule,
        MatSidenavModule,
        MatProgressBarModule,
        MatTabsModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatStepperModule,
        SourceContactListModule,
        CurrencySelectorModule,
        CRMDashboardWidgetsModule,
        ContactsModule,
        FileUploadModule,
        UtilsModule,
        PipelineModule,
        SharedIntroStepsModule,
        LoadingSpinnerModule,
        BankCodeLettersModule,
        SliceModule,
        MapModule,
        OrderDropdownModule,
        ActionMenuModule,
        InvoiceGridMenuModule,
        StaticListModule,
        StaticTreeViewModule,
        CountryPhoneNumberModule,
        ModalDialogModule,
        ListsModule,
        GooglePlaceModule,
        MatInputModule,
        MatButtonModule,
        TenantSettingsWizardModule,
        LeftMenuModule,
        ZapierModule,
        EditTenantModule,
        LucideAngularModule.pick({
            House,
            Users,
            TrendingUp,
            ChartColumn,
            Globe,
            Search,
            Filter,
            MapPin,
            FileText,
            Wifi,
            DollarSign,
            Target,
            User,
            Crosshair,
            Clock,
            BarChart3,
            Crown,
            Star,
            Zap,
            Award,
            BadgeDollarSign,
        }),
    ],
    declarations: [
        ClientsComponent,
        DocumentsComponent,
        PartnersComponent,
        ProductsComponent,
        CouponsComponent,
        AddCouponDialogComponent,
        LeadsComponent,
        OrdersComponent,
        InvoicesComponent,
        ReportsComponent,
        WelcomeComponent,
        DashboardComponent,
        ShortcutsComponent,
        ImportListComponent,
        ImportLeadsComponent,
        BankSettingsDialogComponent,
        CrmIntroComponent,
        ActivityComponent,
        TypesDropdownComponent,
        EntityCheckListDialogComponent,
        OrdersHeaderDropdownComponent,
        CommissionHistoryComponent,
        CommissionEarningsDialogComponent,
        LedgerCompleteDialogComponent,
        LedgerHistoryDialogComponent,
        PayPalCompleteDialogComponent,
        RequestWithdrawalDialogComponent,
        UpdateCommissionableDialogComponent,
        UpdateCommissionRateDialogComponent,
        EditTypeItemDialogComponent,
        TenantReportsComponent,
        LeadConversionJourneyComponent,
        StatCardComponent,
        LeadDetailCardComponent,
        UtmParametersCardComponent,
        LocationNetworkComponent,
        DeviceSessionComponent,
        CustomFieldsComponent,
        UrlInfoComponent,
        VisitHistoryComponent,
        AggregateAnalyticsDashboardComponent,
        AggregateAnalyticsHeaderComponent,
        AggregateAnalyticsFiltersComponent,
        AggregateAnalyticsDateRangeComponent,
        AggregateAnalyticsSelectorComponent,
        StatsCardsComponent,
        KeywordsComponent,
        ReferrersComponent,
        CountriesComponent,
        StatesComponent,
        DevicesComponent,
        BrowsersComponent,
        EntryPagesComponent,
        NetworksComponent,
        IpAddressesComponent,
        ConversionTrackingComponent,
        HeaderComponent,
        ConversionMetricsComponent,
        TopAffiliatesComponent,
        ConversionShareChartComponent,
        VisitsTrendChartComponent,
        HourlyTrafficHeatmapComponent,
        MonthlyRevenueChartComponent,
        ConversionTrendsChartComponent,
        TrafficConversionsChartComponent,
        TopAffiliatePerformanceComponent,
        KeyMetricsPanelComponent,
    ],
    providers: [
        ImportServiceProxy,
        ImportLeadsService,
        DataSourceService,
        LeftMenuService,
        CalendarService,
        CrmContactGroupGuard,
        { provide: "leftMenuCollapsed", useValue: AppConsts.isMobile },
        { provide: "showGlobalSearch", useValue: true },
    ],
    entryComponents: [
        AddCouponDialogComponent,
        BankSettingsDialogComponent,
        CrmIntroComponent,
        EntityCheckListDialogComponent,
        CommissionEarningsDialogComponent,
        LedgerCompleteDialogComponent,
        LedgerHistoryDialogComponent,
        RequestWithdrawalDialogComponent,
        UpdateCommissionableDialogComponent,
        UpdateCommissionRateDialogComponent,
        EditTypeItemDialogComponent,
    ],
})
export class CrmModule {
    private readonly name = "CRM";

    constructor(
        private appService: AppService,
        private appStoreService: AppStoreService,
        private importLeadsService: ImportLeadsService,
        private permissionService: AppPermissionService,
        private store$: Store<AppStore.State>
    ) {
        if (abp.session.userId) {
            setTimeout(() => this.appStoreService.loadUserDictionaries(), 2000);
            if (permissionService.isGranted(AppPermissions.CRMBulkImport))
                appService.subscribeModuleChange((config) => {
                    if (config["name"] == this.name)
                        importLeadsService.setupImportCheck();
                    else importLeadsService.stopImportCheck();
                });
            if (this.permissionService.isGranted(AppPermissions.CRM)) {
                this.store$.dispatch(
                    new PipelinesStoreActions.LoadRequestAction(false)
                );
            }
        }
    }
}
