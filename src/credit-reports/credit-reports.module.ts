import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalModule, TooltipModule } from 'ngx-bootstrap';
import { FileUploadModule } from '@node_modules/ng2-file-upload';
import { CreditReportsCommonModule } from './shared/common/credit-reports-common.module';
import { CreditReportsRoutingModule } from './credit-reports-routing.module';
import { CreditReportsComponent } from './credit-reports.component';
import { LayoutModule } from './shared/layout/layout.module';
import { LayoutCommonModule } from '@app/shared/layout/layout-common.module';
import { TermsOfServiceComponent } from './pages/terms-of-service/terms-of-service.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { PackageIdService } from './shared/common/packages/package-id.service';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { CreditReportServiceProxy } from '@shared/service-proxies/service-proxies';
import { KbaResultModule } from './member-area/kba-result/kba-result.module';

import { CacheService } from 'ng2-cache-service';

@NgModule({
    declarations: [
        CreditReportsComponent,
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

        CreditReportsRoutingModule,
        CreditReportsCommonModule.forRoot()
    ],
    providers: [
        PackageIdService,
        CreditReportServiceProxy,
        CacheService
    ]
})
export class CreditReportsModule { }
