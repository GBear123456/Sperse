/** Core imports */
import * as ngCommon from '@angular/common';
import { NgModule } from '@angular/core';

/** Third party imports */
import { ngxZendeskWebwidgetModule, ngxZendeskWebwidgetConfig, ngxZendeskWebwidgetService } from 'ngx-zendesk-webwidget';

/** Application imports */
import { AppStoreModule } from '@app/store/app-store.module';
import { ImpersonationService } from '@admin/users/impersonation.service';
import { ExportService } from '@shared/common/export/export.service';
import { ExportGoogleSheetService } from '@shared/common/export/export-google-sheets/export-google-sheets';
import { AppComponent} from './app.component';
import { AppService } from './app.service';
import { ClipboardModule } from 'ngx-clipboard';
import { LayoutModule } from './shared/layout/layout.module';
import { LayoutCommonModule } from './shared/layout/layout-common.module';
import { AppCommonModule } from './shared/common/app-common.module';
import { AppRoutingModule } from './app-routing.module';
import { AccessDeniedComponent } from './main/access-denied/access-denied.component';
import { FiltersModule } from '@shared/filters/filters.module';
import { CFOService } from '@shared/cfo/cfo.service';
import {
    InstanceServiceProxy, ContactServiceProxy, BankAccountsServiceProxy,
    BusinessEntityServiceProxy, TenantSubscriptionServiceProxy, CashflowServiceProxy, CashFlowForecastServiceProxy
} from '@shared/service-proxies/service-proxies';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';

export class ZendeskConfig extends ngxZendeskWebwidgetConfig {
    accountUrl = abp.setting.values['Integrations:Zendesk:AccountUrl'];
    beforePageLoad(zE) {
        zE.setLocale('en');
//        zE.hide();
    }
}

@NgModule({
    declarations: [
        AppComponent,
        AccessDeniedComponent        
    ],
    imports: [
        LayoutModule,
        LayoutCommonModule,
        AppCommonModule.forRoot(),
        ngxZendeskWebwidgetModule.forRoot(ZendeskConfig),
        ngCommon.CommonModule,
        AppRoutingModule,
        FiltersModule.forRoot(),
        ClipboardModule,
        AppStoreModule
    ],
    providers: [
        AppService,
        ImpersonationService,
        ngxZendeskWebwidgetService,
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
        CashFlowForecastServiceProxy
    ]
})
export class AppModule {}
