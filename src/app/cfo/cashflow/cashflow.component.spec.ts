import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CashflowComponent } from './cashflow.component';
import 'zone.js/dist/zone-testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HeadLineComponent } from '@app/shared/common/headline/headline.component';
import { SelectionFilterComponent } from '@shared/cfo/bank-accounts/selection-filter/selection-filter.component';
import { SynchProgressComponent } from '@shared/cfo/bank-accounts/synch-progress/synch-progress.component';
import { CalendarButtonComponent } from '@app/cfo/shared/common/calendar-button/calendar-button.component';
import { OperationsComponent } from '@app/cfo/cashflow/operations/operations.component';
import { ToolBarComponent } from '@app/shared/common/toolbar/toolbar.component';
import {
    DxButtonComponent, DxDataGridComponent,
    DxPivotGridComponent, DxProgressBarComponent,
    DxResizableComponent, DxScrollViewComponent, DxSelectBoxComponent,
    DxTabsComponent, DxTagBoxComponent, DxTemplateDirective, DxToolbarComponent, DxTooltipComponent
} from '@root/node_modules/devextreme-angular';
import { DxoEditingComponent } from '@root/node_modules/devextreme-angular/ui/nested/editing';
import { DxoHeaderFilterComponent } from '@root/node_modules/devextreme-angular/ui/nested/header-filter';
import { DxoSelectionComponent } from '@root/node_modules/devextreme-angular/ui/nested/selection';
import { DxoStateStoringComponent } from '@root/node_modules/devextreme-angular/ui/nested/state-storing';
import { DxiValidationRuleComponent } from '@root/node_modules/devextreme-angular/ui/nested/validation-rule-dxi';
import { DxiColumnComponent } from '@root/node_modules/devextreme-angular/ui/nested/column-dxi';
import { DxoLoadPanelComponent } from '@root/node_modules/devextreme-angular/ui/nested/load-panel';
import { NoDataComponent } from '@shared/common/widgets/no-data/no-data.component';
import { DxoScrollingComponent } from '@root/node_modules/devextreme-angular/ui/nested/scrolling';
import { CalculatorComponent } from '@app/cfo/shared/calculator-widget/calculator-widget.component';
import { RoundProgressComponent } from '@root/node_modules/angular-svg-round-progressbar';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import {
    BankAccountsServiceProxy, BusinessEntityServiceProxy,
    CashflowServiceProxy,
    ContactServiceProxy, InstanceServiceProxy, MyFinancesServiceProxy,
    PermissionServiceProxy, PersonContactServiceProxy,
    SessionServiceProxy, SyncServiceProxy, TenantSubscriptionServiceProxy
} from '@shared/service-proxies/service-proxies';
import { LayoutService } from '@app/shared/layout/layout.service';
import { AppService } from '@app/app.service';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CashflowService } from '@app/cfo/cashflow/cashflow.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { CFOService } from '@shared/cfo/cfo.service';
import { UserPreferencesService } from '@app/cfo/cashflow/preferences-dialog/preferences.service';
import { CacheService } from '@node_modules/ng2-cache-service';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { FiltersService } from '@shared/filters/filters.service';
import { MatDialogModule } from '@angular/material';
import { CalculatorService } from '@app/cfo/shared/calculator-widget/calculator-widget.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { CfoPreferencesService } from '@app/cfo/cfo-preferences.service';
import { RootStoreModule } from '@root/store';
import { AbpModule } from '@abp/abp.module';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { RouterTestingModule } from '@angular/router/testing';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';

abp.timing['timeZoneInfo'] = {
    iana: { timeZoneId: 'UTC' },
    windows: {
        timeZoneId: 'UTC',
        baseUtcOffsetInMilliseconds: 0,
        currentUtcOffsetInMilliseconds: 0,
        isDaylightSavingTimeNow: false,
    }
};

describe('CashflowComponent', () => {
    let component: CashflowComponent;
    let fixture: ComponentFixture<CashflowComponent>;

    beforeEach(async(() => {
        TestBed.resetTestEnvironment();
        TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
        TestBed.configureTestingModule({
            imports: [
                RouterModule,
                RouterTestingModule,
                MatDialogModule,
                RootStoreModule,
                AbpModule
            ],
            declarations: [
                CashflowComponent,
                HeadLineComponent,
                SelectionFilterComponent,
                SynchProgressComponent,
                CalendarButtonComponent,
                OperationsComponent,
                ToolBarComponent,
                DxButtonComponent,
                DxTabsComponent,
                DxPivotGridComponent,
                DxResizableComponent,
                DxDataGridComponent,
                DxoEditingComponent,
                DxoHeaderFilterComponent,
                DxoSelectionComponent,
                DxoStateStoringComponent,
                DxiValidationRuleComponent,
                DxiColumnComponent,
                DxoLoadPanelComponent,
                NoDataComponent,
                DxSelectBoxComponent,
                DxTemplateDirective,
                DxoScrollingComponent,
                DxScrollViewComponent,
                CalculatorComponent,
                DxTagBoxComponent,
                RoundProgressComponent,
                DxProgressBarComponent,
                DxTooltipComponent,
                DxToolbarComponent
            ],
            providers: [
                HttpClient,
                CashflowService,
                UserPreferencesService,
                AppSessionService,
                SessionServiceProxy,
                HttpClient,
                HttpHandler,
                AbpMultiTenancyService,
                CacheService,
                CFOService,
                AppService,
                FeatureCheckerService,
                AppPermissionService,
                PermissionServiceProxy,
                PermissionCheckerService,
                InstanceServiceProxy,
                PersonContactServiceProxy,
                NotifyService,
                AppLocalizationService,
                TenantSubscriptionServiceProxy,
                LayoutService,
                ContactServiceProxy,
                CashflowServiceProxy,
                FiltersService,
                CalculatorService,
                BankAccountsService,
                BankAccountsServiceProxy,
                BusinessEntityServiceProxy,
                CfoPreferencesService,
                AppUiCustomizationService,
                AppHttpInterceptor,
                AppHttpConfiguration,
                AppUrlService,
                CacheHelper,
                LoadingService,
                ProfileService,
                SynchProgressService,
                SyncServiceProxy,
                MyFinancesServiceProxy
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CashflowComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

});
