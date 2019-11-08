/** Core imports */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/** Application imports */
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { RegisterTenantOutput } from '@shared/service-proxies/service-proxies';
import { TenantRegistrationHelperService } from './tenant-registration-helper.service';
import { AppLocalizationService } from '../../../app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './register-tenant-result.component.html',
    animations: [accountModuleAnimation()]
})
export class RegisterTenantResultComponent implements OnInit {

    model: RegisterTenantOutput = new RegisterTenantOutput();
    tenantUrl: string;
    saving = false;

    constructor(
        private router: Router,
        private appUrlService: AppUrlService,
        private tenantRegistrationHelper: TenantRegistrationHelperService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        if (!this.tenantRegistrationHelper.registrationResult) {
            this.router.navigate(['account/login']);
            return;
        }

        this.model = this.tenantRegistrationHelper.registrationResult;
        abp.multiTenancy.setTenantIdCookie(this.model.tenantId);
        this.tenantUrl = this.appUrlService.getAppRootUrlOfTenant(this.model.tenancyName);
    }
}
