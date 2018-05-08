import * as ngCommon from '@angular/common';
import {NgModule} from '@angular/core';

import {LayoutModule} from './shared/layout/layout.module';
import {AppCommonModule} from './shared/common/app-common.module';
import {AppRoutingModule} from './app-routing.module';

import {AppComponent} from './app.component';
import {AppService} from './app.service';

import {ImpersonationService} from '@admin/users/impersonation.service';
import {AppConsts} from '@shared/AppConsts';

import {ngxZendeskWebwidgetModule, ngxZendeskWebwidgetConfig, ngxZendeskWebwidgetService} from 'ngx-zendesk-webwidget';
import {CacheService} from 'ng2-cache-service';

export class ZendeskConfig extends ngxZendeskWebwidgetConfig {
    accountUrl = 'sperse.zendesk.com';
    beforePageLoad(zE) {
        zE.setLocale('en');
        zE.hide();
    }
}

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        LayoutModule,
        AppCommonModule.forRoot(),
        ngxZendeskWebwidgetModule.forRoot(ZendeskConfig),
        ngCommon.CommonModule,
        AppRoutingModule
    ],
    providers: [
        AppService,
        CacheService,
        ImpersonationService,
        ngxZendeskWebwidgetService
    ]
})
export class AppModule {}