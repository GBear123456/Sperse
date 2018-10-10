import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule, TooltipModule } from 'ngx-bootstrap';
import { FileUploadModule } from '@node_modules/ng2-file-upload';
import { PersonalFinanceCommonModule } from './shared/common/personal-finance-common.module';
import { PersonalFinanceRoutingModule } from './personal-finance-routing.module';
import { PersonalFinanceComponent } from './personal-finance.component';
import { LayoutModule } from './shared/layout/layout.module';
import { LayoutCommonModule } from '@app/shared/layout/layout-common.module';
import { TermsOfServiceComponent } from './pages/terms-of-service/terms-of-service.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { PackageIdService } from './shared/common/packages/package-id.service';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { CreditReportServiceProxy } from '@shared/service-proxies/service-proxies';
import { KbaResultModule } from './member-area/kba-result/kba-result.module';
import { CacheStorageAbstract } from 'ng2-cache-service/dist/src/services/storage/cache-storage-abstract.service';
import { CacheMemoryStorage } from 'ng2-cache-service/dist/src/services/storage/memory/cache-memory.service';

@NgModule({
    declarations: [
        PersonalFinanceComponent,
        TermsOfServiceComponent,
        PrivacyPolicyComponent,
        ContactUsComponent,
        AboutUsComponent
    ],
    imports: [
        ModalModule.forRoot(),
        TooltipModule.forRoot(),
        FileUploadModule,
        LayoutModule,
        LayoutCommonModule,
        CommonModule,
        KbaResultModule,

        PersonalFinanceRoutingModule,
        PersonalFinanceCommonModule.forRoot()
    ],
    providers: [
        PackageIdService,
        CreditReportServiceProxy,
        {
            provide: CacheStorageAbstract,
            useClass: CacheMemoryStorage
        },
    ]
})
export class PersonalFinanceModule { }
