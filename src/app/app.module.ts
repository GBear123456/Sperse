/** Core imports */
import * as ngCommon from '@angular/common';
import {NgModule} from '@angular/core';

/** Third party imports */
import {ngxZendeskWebwidgetModule, ngxZendeskWebwidgetConfig, ngxZendeskWebwidgetService} from 'ngx-zendesk-webwidget';
import {CacheService} from 'ng2-cache-service';
import {CacheStorageAbstract} from 'ng2-cache-service/dist/src/services/storage/cache-storage-abstract.service';
import {CacheMemoryStorage} from 'ng2-cache-service/dist/src/services/storage/memory/cache-memory.service';

/** Application imports */
import { BankAccountsService } from '@app/cfo/shared/helpers/bank-accounts.service';
import {ImpersonationService} from '@admin/users/impersonation.service';
import {AppComponent} from './app.component';
import {AppService} from './app.service';
import { LayoutModule } from './shared/layout/layout.module';
import { LayoutCommonModule } from './shared/layout/layout-common.module';
import {AppCommonModule} from './shared/common/app-common.module';
import {AppRoutingModule} from './app-routing.module';
import { AccessDeniedComponent } from './main/access-denied/access-denied.component';
import { FiltersModule } from '@shared/filters/filters.module';
import { CFOService } from '@shared/cfo/cfo.service';
import { InstanceServiceProxy, ContactServiceProxy, BankAccountsServiceProxy, BusinessEntityServiceProxy } from '@shared/service-proxies/service-proxies';

export class ZendeskConfig extends ngxZendeskWebwidgetConfig {
    accountUrl = 'sperse.zendesk.com';
    beforePageLoad(zE) {
        zE.setLocale('en');
        zE.hide();
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
        FiltersModule.forRoot()
    ],
    providers: [
        AppService,
        CacheService,
        {
            provide: CacheStorageAbstract,
            useClass: CacheMemoryStorage
        },
        ImpersonationService,
        ngxZendeskWebwidgetService,
        InstanceServiceProxy,
        CFOService,
        ContactServiceProxy,
        BusinessEntityServiceProxy,
        BankAccountsServiceProxy,
        BankAccountsService
    ]
})
export class AppModule {}
