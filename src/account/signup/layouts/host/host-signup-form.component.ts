/** Core imports */
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

/** Third party imports */
import { NotifyService } from 'abp-ng2-module';
import { MatDialog } from '@angular/material/dialog';
import { first } from 'rxjs/operators';
import { Observable } from 'rxjs';
import * as moment from 'moment';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AbpSessionService } from 'abp-ng2-module';
import { SessionServiceProxy, LeadServiceProxy, TenantProductInfo, PaymentPeriodType,
    ProductServiceProxy, SubmitTenancyRequestInput } from '@shared/service-proxies/service-proxies';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './host-signup-form.component.html',
    styleUrls: [
        '../../../../assets/fonts/fonts-outfit-light.css',
        '../../../../assets/fonts/sperser-extension.css',
        './host-signup-form.component.less',
    ],
    providers: [LeadServiceProxy, ProductServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HostSignupFormComponent implements OnInit {
    @ViewChild('firstStepForm') firstStepForm;
    @ViewChild('phoneNumber') phoneNumber;

    defaultCountryCode: string;
    selectedCountryCode: string;

    tenancyRequest = new SubmitTenancyRequestInput();

    nameRegexp = AppConsts.regexPatterns.name;
    emailRegexp = AppConsts.regexPatterns.email;

    constructor(
        private notifyService: NotifyService,
        private sessionService: AbpSessionService,
        private changeDetectorRef: ChangeDetectorRef,
        private sessionAppService: SessionServiceProxy,
        private productProxy: ProductServiceProxy,
        private leadProxy: LeadServiceProxy,
        public appSession: AppSessionService,
        public dialog: MatDialog,
        public ls: AppLocalizationService
    ) {
        this.tenancyRequest.tag = 'Demo Request';
        this.tenancyRequest.stage = 'Interested';
        this.productProxy.getSubscriptionProductsByGroupName('signup').subscribe(products => {
            let product = products[0];
            if (product) {
                let option = product.productSubscriptionOptions[0];
                this.tenancyRequest.products = [new TenantProductInfo({
                    productId: product.id,
                    paymentPeriodType: option && PaymentPeriodType[option.frequency],
                    quantity: 1,
                })];
            }
        });
    }

    ngOnInit(): void {
    }

    getDefaultCode(event) {
        setTimeout(() => {
            this.selectedCountryCode = this.defaultCountryCode = event.intPhoneNumber.defaultCountry;
        }, 100);
    }

    getChangedCountry(event) {
        this.selectedCountryCode = event.countryCode;
    }

    processTenantRegistrationRequest() {
        //this.changeDetectorRef.detectChanges();
        if (!this.firstStepForm.valid || (this.phoneNumber && !this.phoneNumber.isValid()))
            return;


        this.leadProxy.submitTenancyRequest(this.tenancyRequest).subscribe(() => {
            //this.notifyService.info(this.ls.l('SavedSuccessfully'));
        });
    }
}