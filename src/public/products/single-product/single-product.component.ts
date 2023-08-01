/** Core imports */
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    PublicProductInfo,
    PublicProductServiceProxy,
    SubmitProductRequestInput
} from '@root/shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'single-product',
    templateUrl: 'single-product.component.html',
    styleUrls: [
        './single-product.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleProductComponent implements OnInit {
    @ViewChild('firstStepForm') firstStepForm;
    @ViewChild('phoneNumber') phoneNumber;

    currentYear: number = new Date().getFullYear();

    tenantId: number;
    productPublicName: string;

    productInfo: PublicProductInfo;
    requestInfo: SubmitProductRequestInput = new SubmitProductRequestInput();

    agreedTermsAndServices: boolean = false;
    nameRegexp = AppConsts.regexPatterns.name;
    emailRegexp = AppConsts.regexPatterns.email;
    conditions = ConditionsType;

    constructor(
        private route: ActivatedRoute,
        private publicProductService: PublicProductServiceProxy,
        private changeDetector: ChangeDetectorRef,
        public ls: AppLocalizationService,
    ) {
    }

    ngOnInit(): void {
        this.tenantId = +this.route.snapshot.paramMap.get('tenantId');
        this.productPublicName = this.route.snapshot.paramMap.get('productPublicName');

        this.getProductInfo();
    }

    getProductInfo() {
        abp.ui.setBusy();
        this.publicProductService
            .getProductInfo(this.tenantId, this.productPublicName)
            .pipe(
                finalize(() => abp.ui.clearBusy())
            )
            .subscribe(result => {
                if (result) {
                    this.productInfo = result;
                    this.changeDetector.detectChanges();

                } else {
                    //TODO: What else ???
                }
            });
    }

    submitRequest() {
        if (!this.firstStepForm.valid || (this.phoneNumber && !this.phoneNumber.isValid()))
            return;

        if (this.phoneNumber && this.phoneNumber.isEmpty())
            this.requestInfo.phone = undefined;

        this.requestInfo.tenantId = this.tenantId;
        this.requestInfo.paymentGateway = 'Stripe';
        this.requestInfo.productId = this.productInfo.id;
        this.requestInfo.unit = this.productInfo.unit;
        this.requestInfo.quantity = 1;

        this.requestInfo.successUrl = AppConsts.appBaseUrl;
        this.requestInfo.cancelUrl = location.href;

        this.publicProductService.submitProductRequest(this.requestInfo)
            .subscribe(res => {
                location.href = res;
            });
    }

    openConditionsDialog(type: ConditionsType) {
        window.open(this.getApiLink(type), '_blank');
    }

    getApiLink(type: ConditionsType) {
        if (this.tenantId)
            return AppConsts.remoteServiceBaseUrl + '/api/TenantCustomization/Get' +
                (type == ConditionsType.Policies ? 'PrivacyPolicy' : 'TermsOfService') +
                'Document?tenantId=' + this.tenantId;
        else
            return AppConsts.appBaseHref + 'assets/documents/' +
                (type == ConditionsType.Terms ? 'SperseTermsOfService.pdf' : 'SpersePrivacyPolicy.pdf');
    }
}
