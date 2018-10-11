/** Application imports */
import { NgModule, Injector, APP_INITIALIZER } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';

/** Third party imports */
import { GestureConfig } from '@angular/material';
import { MatSlider, MatSliderModule } from '@angular/material/slider';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';

/** Application imports */
import { PackageChooserComponent } from '../../../../src/app/shared/common/payment-wizard/package-chooser/package-chooser.component';
import { PackageCardComponent } from '@app/shared/common/payment-wizard/package-chooser/package-card/package-card.component';
import { AbpModule } from '@abp/abp.module';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { API_BASE_URL, PackageServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { PackageChooserWidgetComponent } from './package-chooser-widget-component';
import { AppConsts } from '@shared/AppConsts';
import { WidgetsService } from '../../../widgets.service';
import { CustomNumberPipe } from '@shared/common/pipes/custom-number/custom-number.pipe';

export function getRemoteUrl() {
    return AppConsts.remoteServiceBaseUrl;
}

export function initialize(widgetsService: WidgetsService, injector: Injector) {
    return widgetsService.initialize(injector);
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
        HttpClientModule
    ],
    providers: [
        AppLocalizationService,
        AppHttpConfiguration,
        PackageServiceProxy,
        WidgetsService,
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
}
