/** Core imports */
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import {
    CustomPeriodType,
    ProductType,
    PublicProductInfo,
    PublicProductServiceProxy,
    PublicProductSubscriptionOptionInfo,
    RecurringPaymentFrequency,
    SubmitProductRequestInput
} from '@root/shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';

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
    currencySymbol = '$';
    submitTitle = 'Purchase';

    tenantId: number;
    productPublicName: string;

    productInfo: PublicProductInfo;
    requestInfo: SubmitProductRequestInput = new SubmitProductRequestInput();

    agreedTermsAndServices: boolean = false;
    nameRegexp = AppConsts.regexPatterns.name;
    emailRegexp = AppConsts.regexPatterns.email;
    conditions = ConditionsType;

    descriptionHtml: SafeHtml;

    showNotFound = false;
    productType = ProductType;
    billingPeriod = BillingPeriod;

    selectedSubscriptionOption: PublicProductSubscriptionOptionInfo;
    static availablePeriodsOrder = [BillingPeriod.Monthly, BillingPeriod.Yearly, BillingPeriod.LifeTime, BillingPeriod.Custom];
    availablePeriods: BillingPeriod[] = [];
    selectedBillingPeriod;


    constructor(
        private route: ActivatedRoute,
        private titleService: Title,
        private publicProductService: PublicProductServiceProxy,
        private appHttpConfiguration: AppHttpConfiguration,
        private changeDetector: ChangeDetectorRef,
        private sanitizer: DomSanitizer,
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
        this.appHttpConfiguration.avoidErrorHandling = true;
        this.publicProductService
            .getProductInfo(this.tenantId, this.productPublicName)
            .pipe(
                finalize(() => {
                    this.appHttpConfiguration.avoidErrorHandling = false;
                    abp.ui.clearBusy();
                })
            )
            .subscribe(result => {
                if (result.id) {
                    this.productInfo = result;
                    this.titleService.setTitle(this.productInfo.name);
                    if (result.descriptionHtml)
                        this.descriptionHtml = this.sanitizer.bypassSecurityTrustHtml(result.descriptionHtml);
                    this.initSubscriptionProduct();
                } else {
                    this.showNotFound = true;
                }

                this.changeDetector.detectChanges();
            }, () => {
                this.showNotFound = true;
                this.changeDetector.detectChanges();
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
        this.requestInfo.quantity = 1;

        switch (this.productInfo.type) {
            case ProductType.General:
                this.requestInfo.unit = this.productInfo.unit;
                break;
            case ProductType.Subscription:
                this.requestInfo.optionId = this.selectedSubscriptionOption.id;
                this.requestInfo.unit = PaymentService.getProductMeasurementUnit(this.selectedSubscriptionOption.frequency);
                break;
        };

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

    initSubscriptionProduct() {
        if (this.productInfo.type != ProductType.Subscription)
            return;

        this.submitTitle = 'Subscribe';

        let periods: RecurringPaymentFrequency[] = this.productInfo.productSubscriptionOptions.map(v => v.frequency);

        let billingPeriods = periods.map(v => PaymentService.getBillingPeriodByPaymentFrequency(v));
        this.availablePeriods = [];
        SingleProductComponent.availablePeriodsOrder.forEach(v => {
            if (billingPeriods.indexOf(v) >= 0)
                this.availablePeriods.push(v);
        });
        this.selectedBillingPeriod = this.availablePeriods[0];
        this.updateSelectedSubscriptionOption();
    }

    getActiveStatus(period: BillingPeriod) {
        return this.selectedBillingPeriod == period;
    }

    toggle(value: BillingPeriod) {
        this.selectedBillingPeriod = value;
        this.updateSelectedSubscriptionOption();
    }

    getSliderValue(): number {
        var periodIndex = this.availablePeriods.find(v => v == this.selectedBillingPeriod);
        var value = periodIndex * (100 / this.availablePeriods.length);
        return +value.toFixed();
    }

    updateSelectedSubscriptionOption() {
        this.selectedSubscriptionOption = this.productInfo.productSubscriptionOptions.find(v => v.frequency == PaymentService.getRecurringPaymentFrequency(this.selectedBillingPeriod));
    }

    getPricePerPeriod(): number {
        return this.selectedBillingPeriod === BillingPeriod.Yearly ?
            Math.round(this.selectedSubscriptionOption.fee / 12) :
            this.selectedSubscriptionOption.fee;
    }

    getPriceDescription(): string {
        if (this.selectedBillingPeriod == BillingPeriod.Custom) {
            return this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'RecurringPaymentFrequency_CustomDescription', this.selectedSubscriptionOption.customPeriodCount,
                this.ls.ls(AppConsts.localization.CRMLocalizationSourceName, 'CustomPeriodType_' + CustomPeriodType[this.selectedSubscriptionOption.customPeriodType]));
        } else {
            return this.ls.l('price' + BillingPeriod[this.selectedBillingPeriod]);
        }
    }
}
