/** Application imports */
import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';

/** Third party imports */

/** Application imports */
import { AppComponent } from './app.component';
import { BankCodeWizzardModule } from '../../../../src/shared/bank-code-wizzard/bank-code-wizzard.module';
import { HomeComponent } from './home/home.component';
import {
    API_BASE_URL, LocalizationServiceProxy, MemberSubscriptionServiceProxy,
    SessionServiceProxy
} from '@shared/service-proxies/service-proxies';
import { WidgetsService } from '../../../widgets.service';
import { AppConsts } from '@shared/AppConsts';
import { APP_BASE_HREF, CommonModule } from '@angular/common';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { ClipboardService } from '@node_modules/ngx-clipboard';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { FullScreenService } from '@shared/common/fullscreen/fullscreen.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';
import { TitleService } from '@shared/common/title/title.service';
import { AppHttpInterceptor } from '@shared/http/appHttpInterceptor';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LifecycleSubjectsService } from '@shared/common/lifecycle-subjects/lifecycle-subjects.service';
import { ProductsService } from '@root/bank-code/products/products.service';
import { HttpClientModule } from '@angular/common/http';
import { AbpModule } from '@abp/abp.module';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { LocalizationResolver } from '@shared/common/localization-resolver';

export function getRemoteUrl() {
    return AppConsts.remoteServiceBaseUrl;
}

export function initialize(
    widgetsService: WidgetsService,
    injector: Injector
) {

    return widgetsService.initialize(injector);
}

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BankCodeWizzardModule,
        AbpModule,
        CommonModule,
        HttpClientModule
    ],
    providers: [
        WidgetsService,
        { provide: APP_BASE_HREF, useValue: AppConsts.appBaseHref },
        {
            provide: APP_INITIALIZER,
            useFactory: initialize,
            deps: [ WidgetsService, Injector ],
            multi: true
        },
        AppSessionService,
        AppLocalizationService,
        SessionServiceProxy,
        ProductsService,
        AppUrlService,
        CacheHelper,
        ClipboardService,
        LoadingService,
        LifecycleSubjectsService,
        AppHttpInterceptor,
        AppHttpConfiguration,
        AppPermissionService,
        AppUiCustomizationService,
        FullScreenService,
        TitleService,
        { provide: API_BASE_URL, useFactory: getRemoteUrl },
        ProfileService,
        MemberSubscriptionServiceProxy,
        LocalizationResolver,
        LocalizationServiceProxy
    ],
    bootstrap: [ AppComponent ]
})
export class AppModule {
    constructor() {
    }
}
