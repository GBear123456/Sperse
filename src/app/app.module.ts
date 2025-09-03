/** Core imports */
import * as ngCommon from "@angular/common";
import { NgModule } from "@angular/core";

/** Third party imports */
import {
    NgxZendeskWebwidgetModule,
    NgxZendeskWebwidgetConfig,
} from "ngx-zendesk-webwidget";
import { ClipboardModule } from "ngx-clipboard";

/** Application imports */
import { AppStoreModule } from "@app/store/app-store.module";
import { ImpersonationService } from "@admin/users/impersonation.service";
import { ExportService } from "@shared/common/export/export.service";
import { ExportGoogleSheetService } from "@shared/common/export/export-google-sheets/export-google-sheets";
import { AppComponent } from "./app.component";
import { AppService } from "./app.service";
import { LayoutModule } from "./shared/layout/layout.module";
import { LayoutCommonModule } from "./shared/layout/layout-common.module";
import { AppCommonModule } from "./shared/common/app-common.module";
import { AppRoutingModule } from "./app-routing.module";
import { AccessDeniedComponent } from "./main/access-denied/access-denied.component";
import { FiltersModule } from "@shared/filters/filters.module";
import { CFOService } from "@shared/cfo/cfo.service";
import { SharedModule } from "./shared/shared.module";
import {
    InstanceServiceProxy,
    ContactServiceProxy,
    BankAccountsServiceProxy,
    BusinessEntityServiceProxy,
    TenantSubscriptionServiceProxy,
    CashflowServiceProxy,
    CashFlowForecastServiceProxy,
} from "@shared/service-proxies/service-proxies";
import { CfoPreferencesService } from "@app/cfo/cfo-preferences.service";
import { UserPreferencesService } from "@app/cfo/cashflow/preferences-dialog/preferences.service";
import { AppStoreService } from "@app/store/app-store.service";
import { ItemDetailsService } from "@shared/common/item-details-layout/item-details.service";
import { SearchTooltipModule } from "@shared/common/dialogs/search-tooltip/search-tooltip.module";
import { EmailSmtpSettingsService } from "@shared/common/settings/email-smtp-settings.service";
import { ToolbarService } from "@app/shared/common/toolbar/toolbar.service";
import { CurrencyCRMService } from "store/currencies-crm-store/currency.service";
import { AiChatbotModule } from "./shared/components/ai-chatbot/ai-chatbot.module";

export class ZendeskConfig extends NgxZendeskWebwidgetConfig {
    override lazyLoad = true;
    accountUrl =
        abp.setting.values["Integrations:Zendesk:AccountUrl"] || "lazyLoad";
    callback(zE) {
        //        zE.setLocale('en');
        //        zE.hide();
    }
}

@NgModule({
    declarations: [AppComponent, AccessDeniedComponent],
    imports: [
        LayoutModule,
        LayoutCommonModule,
        AppCommonModule.forRoot(),
        NgxZendeskWebwidgetModule.forRoot(ZendeskConfig),
        ngCommon.CommonModule,
        AppRoutingModule,
        FiltersModule.forRoot(),
        ClipboardModule,
        AppStoreModule,
        SearchTooltipModule,
        SharedModule,
        AiChatbotModule,
    ],
    providers: [
        AppService,
        AppStoreService,
        ImpersonationService,
        InstanceServiceProxy,
        CFOService,
        ContactServiceProxy,
        BusinessEntityServiceProxy,
        BankAccountsServiceProxy,
        TenantSubscriptionServiceProxy,
        ExportService,
        ExportGoogleSheetService,
        CashflowServiceProxy,
        UserPreferencesService,
        CfoPreferencesService,
        CashFlowForecastServiceProxy,
        ItemDetailsService,
        EmailSmtpSettingsService,
        ToolbarService,
        CurrencyCRMService,
    ],
})
export class AppModule {}
