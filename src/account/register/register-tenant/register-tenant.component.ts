/** Core imports */
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { PaymentPeriodType, SubscriptionPaymentGatewayType, SubscriptionStartType } from '@shared/AppEnums';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { EditionSelectDto, PasswordComplexitySetting, PaymentServiceProxy, ProfileServiceProxy, RegisterTenantOutput, TenantRegistrationServiceProxy } from '@shared/service-proxies/service-proxies';
import { RegisterTenantModel } from './register-tenant.model';
import { TenantRegistrationHelperService } from '../tenant-registration-helper.service';
import { AppLocalizationService } from '../../../app/shared/common/localization/app-localization.service';
import { AppSessionService } from '../../../shared/common/session/app-session.service';
import { SettingService } from 'abp-ng2-module/dist/src/settings/setting.service';
import { TenantHostType } from '../../../shared/service-proxies/service-proxies';
import { NotifyService } from 'abp-ng2-module/dist/src/notify/notify.service';
import { MessageService } from 'abp-ng2-module/dist/src/message/message.service';

@Component({
    templateUrl: './register-tenant.component.html',
    animations: [accountModuleAnimation()]
})
export class RegisterTenantComponent implements OnInit, AfterViewInit {

    model: RegisterTenantModel = new RegisterTenantModel();
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    subscriptionStartType = SubscriptionStartType;
    paymentPeriodType = PaymentPeriodType;
    paymentId = '';
    recaptchaSiteKey: string = AppConsts.recaptchaSiteKey;
    saving = false;

    constructor(
        private tenantRegistrationService: TenantRegistrationServiceProxy,
        private router: Router,
        private profileService: ProfileServiceProxy,
        private tenantRegistrationHelper: TenantRegistrationHelperService,
        private activatedRoute: ActivatedRoute,
        private appSession: AppSessionService,
        private message: MessageService,
        private setting: SettingService,
        private notify: NotifyService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.model.editionId = this.activatedRoute.snapshot.queryParams['editionId'];
        if (this.model.editionId) {
            this.model.subscriptionStartType = this.activatedRoute.snapshot.queryParams['subscriptionStartType'];
            this.model.gateway = this.activatedRoute.snapshot.queryParams['gateway'];
            this.model.paymentId = this.activatedRoute.snapshot.queryParams['paymentId'];
        }

        //Prevent to create tenant in a tenant context
        if (this.appSession.tenant != null) {
            this.router.navigate(['account/login']);
            return;
        }

        this.profileService.getPasswordComplexitySetting().subscribe(result => {
            this.passwordComplexitySetting = result.setting;
        });
    }

    ngAfterViewInit() {
        if (this.model.editionId) {
            this.tenantRegistrationService.getEdition(this.model.editionId)
                .subscribe((result: EditionSelectDto) => {
                    this.model.edition = result;
                });
        }
    }

    get useCaptcha(): boolean {
        return this.setting.getBoolean('App.TenantManagement.UseCaptchaOnRegistration');
    }

    save(): void {
        if (this.useCaptcha && !this.model.captchaResponse) {
            this.message.warn(this.ls.l(('CaptchaCanNotBeEmpty')));
            return;
        }

        this.saving = true;
        this.model.tenantHostType = <any>TenantHostType.PlatformApp;
        this.tenantRegistrationService.registerTenant(this.model)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe((result: RegisterTenantOutput) => {
                this.notify.success(this.ls.l(('SuccessfullyRegistered'));

                this.tenantRegistrationHelper.registrationResult = result;
                this.router.navigate(['account/register-tenant-result']);
            });
    }

    captchaResolved(captchaResponse: string): void {
        this.model.captchaResponse = captchaResponse;
    }
}
