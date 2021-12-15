/** Application imports */
import { NgModule, Injector, APP_INITIALIZER } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';

/** Third party imports */
import { GestureConfig } from '@angular/material';
import { MatSlider, MatSliderModule } from '@angular/material/slider';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';

/** Application imports */
import { CountryService } from '@root/node_modules/ngx-international-phone-number/src/country.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { PackageChooserComponent } from '@app/shared/common/payment-wizard/package-chooser/package-chooser.component';
import { PackageCardComponent } from '@app/shared/common/payment-wizard/package-chooser/package-card/package-card.component';
import { AbpModule } from 'abp-ng2-module';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import {
    API_BASE_URL,
    LocalizationServiceProxy,
    PackageServiceProxy,
    SessionServiceProxy,
    TenantHostServiceProxy
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { PackageChooserWidgetComponent } from './package-chooser-widget-component';
import { AppConsts } from '@shared/AppConsts';
import { WidgetsService } from '../../../widgets.service';
import { CustomNumberPipe } from '@shared/common/pipes/custom-number/custom-number.pipe';
import { LocalizationResolver } from '@shared/common/localization-resolver';
import { AbpMultiTenancyService } from 'abp-ng2-module';
import { StatesService } from '@root/store/states-store/states.service';
import { createCustomElement } from '@angular/elements';
import { RootStoreModule } from '@root/store';

export function getRemoteUrl() {
    return AppConsts.remoteServiceBaseUrl;
}

export function initialize(widgetsService: WidgetsService, injector: Injector) {
    return widgetsService.initialize(injector, () => {
        const packageChooserElement = createCustomElement(PackageChooserWidgetComponent, { injector: injector });
        customElements.define('package-chooser-widget', packageChooserElement);
    });
}

@NgModule({
    declarations: [
        PackageChooserComponent,
        PackageChooserWidgetComponent,
        PackageCardComponent,
        CustomNumberPipe
    ],
    imports: [
        AbpModule,
        BrowserModule,
        MatSliderModule,
        MatSlideToggleModule,
        RootStoreModule,
        HttpClientModule
    ],
    providers: [
        StatesService,
        CountryService,
        AppSessionService,
        AppLocalizationService,
        AppHttpConfiguration,
        TenantHostServiceProxy,
        AbpMultiTenancyService,
        LocalizationResolver,
        PackageServiceProxy,
        SessionServiceProxy,
        WidgetsService,
        LocalizationServiceProxy,
        { provide: HTTP_INTERCEPTORS, useClass: AppHttpInterceptor, multi: true },
        { provide: API_BASE_URL, useFactory: getRemoteUrl },
        {
            provide: APP_INITIALIZER,
            useFactory: initialize,
            deps: [ WidgetsService, Injector ],
            multi: true
        },
        {
            provide: HAMMER_GESTURE_CONFIG,
            useClass: GestureConfig
        }
    ],
    entryComponents: [ MatSlider, MatSlideToggle, PackageChooserWidgetComponent, PackageCardComponent ],
    bootstrap: []
})
export class AppModule {
    constructor() {}
    ngDoBootstrap() {}
}