/** Core imports */
import * as ngCommon from '@angular/common';
import {NgModule} from '@angular/core';

/** Third party imports */
import {ngxZendeskWebwidgetModule, ngxZendeskWebwidgetConfig, ngxZendeskWebwidgetService} from 'ngx-zendesk-webwidget';
import {CacheService} from 'ng2-cache-service';
import {CacheStorageAbstract} from 'ng2-cache-service/dist/src/services/storage/cache-storage-abstract.service';
import {CacheMemoryStorage} from 'ng2-cache-service/dist/src/services/storage/memory/cache-memory.service';

/** Application imports */
import {ImpersonationService} from '@admin/users/impersonation.service';
import {AppComponent} from './app.component';
import {AppService} from './app.service';
import {LayoutModule} from './shared/layout/layout.module';
import {AppCommonModule} from './shared/common/app-common.module';
import {AppRoutingModule} from './app-routing.module';

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
        {
            provide: CacheStorageAbstract,
            useClass: CacheMemoryStorage
        },
        ImpersonationService,
        ngxZendeskWebwidgetService
    ]
})
export class AppModule {}
