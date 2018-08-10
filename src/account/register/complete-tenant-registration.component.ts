import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
    TenantRegistrationServiceProxy, CompleteTenantRegistrationInput, CompleteTenantRegistrationOutput, TenantHostType,
    TenantPaymentAuthorizeRequestDto, PaymentAuthorizeResponseDto
} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { LoginService } from './../login/login.service';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { finalize } from 'rxjs/operators';
import { PaymentInfoComponent } from '@shared/common/widgets/payment-info/payment-info.component';

@Component({
    templateUrl: './complete-tenant-registration.component.html',
    styleUrls: ['./complete-tenant-registration.component.less',],
    animations: [accountModuleAnimation()]
})
export class CompleteTenantRegistrationComponent extends AppComponentBase implements OnInit {
    @ViewChild(PaymentInfoComponent) paymentInfo: PaymentInfoComponent;
    model: CompleteTenantRegistrationInput = new CompleteTenantRegistrationInput();

    paymentRequired = false;
    paymentHolderName: string;
    paymentResponse: PaymentAuthorizeResponseDto;

    constructor(
        injector: Injector,
        private _router: Router,
        private _appUrlService: AppUrlService,
        private _activatedRoute: ActivatedRoute,
        public loginService: LoginService,
        private _tenantRegistrationService: TenantRegistrationServiceProxy,
        private _authService: AppAuthService
    ) {
        super(injector);
    }

    ngOnInit() {
        this._authService.logout(false);
        this.model.leadRequestXref = this._activatedRoute.snapshot.queryParams['leadRequestXref'];
        this.registerTenant();
    }

    save(): void {
        this.registerTenant();
    }

    registerTenant(): void {
        this.model.adminPassword = this.generatePassword();
        this.model.tenantHostType = <any>TenantHostType.PlatformUi;
        this.startLoading(true);
        this._tenantRegistrationService.completeTenantRegistration(this.model)
            .pipe(finalize(() => { this.finishLoading(true); }))
            .subscribe((result: CompleteTenantRegistrationOutput) => {
                if (result.paymentIsNeeded) {
                    this.paymentRequired = true;
                    this.paymentHolderName = result.paymentHolderName;
                }
                else {
                    this.notify.success(this.l('SuccessfullyRegistered'));
                    this.login(result);
                }
            });
    }

    login(registrationResult: CompleteTenantRegistrationOutput): void {

        this.loginService.authenticateModel.userNameOrEmailAddress = registrationResult.emailAddress;
        this.loginService.authenticateModel.password = this.model.adminPassword;

        abp.multiTenancy.setTenantIdCookie(registrationResult.tenantId);
        this.loginService.authenticate(() => { });
    }

    generatePassword(): string {
        let number = Math.random();
        let result = number.toString(36).substring(6);
        return result;
    }

    billingInfoSubmit(event) {
        let validationResult = this.paymentInfo.validationGroup.validate();
        if (!validationResult.isValid) {
            return;
        }

        let model = new TenantPaymentAuthorizeRequestDto();
        model.bankCard = this.paymentInfo.bankCard;
        model.bankCard.holderName = this.paymentHolderName;
        model.bankCard.billingCountryCode = 'US';
        model.leadRequestXref = this.model.leadRequestXref;
        this.startLoading(true);
        this._tenantRegistrationService.paymentAuthorize(model)
            .subscribe((result) => {
                if (result.success) {
                    this.model.paymentIsPassed = true;
                    this.registerTenant();
                }
                else {
                    this.paymentResponse = result;
                }
            }, () => this.finishLoading(true));
    }
}
