/** Core imports */
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';

/** Application imports */
import {
    CustomPeriodType,
    ProductType,
    PublicProductInfo,
    PublicProductServiceProxy,
    PublicProductSubscriptionOptionInfo,
    RecurringPaymentFrequency,
    SubmitProductRequestInput,
    SubmitProductRequestOutput
} from '@root/shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { ConditionsType } from '@shared/AppEnums';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BillingPeriod } from '@app/shared/common/payment-wizard/models/billing-period.enum';
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { AppHttpConfiguration } from '@shared/http/appHttpConfiguration';
import { PayPalComponent } from '@shared/common/paypal/paypal.component';
import { ButtonType } from '@shared/common/paypal/button-type.enum';

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
    @ViewChild(PayPalComponent) set paypPalComponent(paypalComp: PayPalComponent) {
        this.payPal = paypalComp;
        this.initializePayPal();
    };

    private payPal: PayPalComponent;
    paypalButtonType: ButtonType = null;

    currentYear: number = new Date().getFullYear();
    currencySymbol = '$';

    tenantId: number;
    productPublicName: string;
    ref: string;

    productInfo: PublicProductInfo;
    requestInfo: SubmitProductRequestInput = new SubmitProductRequestInput();

    agreedTermsAndServices: boolean = false;
    nameRegexp = /^[a-zA-Z-.' ]+$/;
    emailRegexp = AppConsts.regexPatterns.email;
    conditions = ConditionsType;

    descriptionHtml: SafeHtml;

    showNotFound = false;
    productType = ProductType;
    billingPeriod = BillingPeriod;

    selectedSubscriptionOption: PublicProductSubscriptionOptionInfo;
    static availablePeriodsOrder = [BillingPeriod.Monthly, BillingPeriod.Yearly, BillingPeriod.LifeTime, BillingPeriod.OneTime, BillingPeriod.Custom];
    availablePeriods: BillingPeriod[] = [];
    selectedBillingPeriod;
    isFreeProductSelected = false;

    initialInvoiceXref: string = null;

    constructor(
        private route: ActivatedRoute,
        private titleService: Title,
        private publicProductService: PublicProductServiceProxy,
        private appHttpConfiguration: AppHttpConfiguration,
        private changeDetector: ChangeDetectorRef,
        private sanitizer: DomSanitizer,
        public ls: AppLocalizationService,
    ) {
        this.requestInfo.quantity = 1;
    }

    ngOnInit(): void {
        this.tenantId = +this.route.snapshot.paramMap.get('tenantId');
        this.productPublicName = this.route.snapshot.paramMap.get('productPublicName');
        this.ref = this.route.snapshot.queryParamMap.get('ref');

        this.getProductInfo();
    }

    initializePayPal() {
        if (this.payPal && this.productInfo && !this.payPal.initialized) {
            let type: ButtonType;
            if (this.productInfo.type == ProductType.General || this.productInfo.type == ProductType.Digital)
                type = ButtonType.Payment;
            else {
                let hasPayment = false;
                let hasRecurring = false;
                let singlePaymentOptions = [RecurringPaymentFrequency.LifeTime, RecurringPaymentFrequency.OneTime];
                this.productInfo.productSubscriptionOptions.map(v => {
                    if (singlePaymentOptions.includes(v.frequency))
                        hasPayment = true
                    else
                        hasRecurring = true;
                });

                type = hasRecurring && hasPayment ? ButtonType.Both :
                    hasRecurring ? ButtonType.Subscription : ButtonType.Payment;
            }
            this.payPal.initialize(this.productInfo.data.paypalClientId, type,
                this.getPayPalRequest.bind(this),
                this.getPayPalRequest.bind(this));
        }
    }

    getPayPalRequest(): Promise<string> {
        return this.getSubmitRequest('PayPal')
            .pipe(
                map(v => v.paymentData)
            )
            .toPromise();
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
                    this.initializePayPal();
                    this.checkIsFree();
                } else {
                    this.showNotFound = true;
                }

                this.changeDetector.detectChanges();
            }, () => {
                this.showNotFound = true;
                this.changeDetector.detectChanges();
            });
    }

    submitStripeRequest() {
        abp.ui.setBusy();
        this.getSubmitRequest('Stripe')
            .pipe(
                finalize(() => abp.ui.clearBusy())
            )
            .subscribe(res => {
                location.href = res.paymentData;
            });
    }

    submitFreeRequest() {
        abp.ui.setBusy();
        this.getSubmitRequest(null)
            .pipe(
                finalize(() => abp.ui.clearBusy())
            )
            .subscribe(() => {
                location.href = this.getReceiptUrl();
            });
    }

    isFormValid(): boolean {
        var isValidObj = this.agreedTermsAndServices && this.firstStepForm && this.firstStepForm.valid && (!this.phoneNumber || this.phoneNumber.isValid());
        return !!isValidObj;
    }

    getSubmitRequest(paymentGateway: string): Observable<SubmitProductRequestOutput> {
        if (!this.isFormValid())
            return;

        if (this.phoneNumber && this.phoneNumber.isEmpty())
            this.requestInfo.phone = undefined;

        this.requestInfo.tenantId = this.tenantId;
        this.requestInfo.affiliateCode = this.ref;
        this.requestInfo.paymentGateway = paymentGateway;
        this.requestInfo.productId = this.productInfo.id;

        switch (this.productInfo.type) {
            case ProductType.General:
            case ProductType.Digital:
                this.requestInfo.unit = this.productInfo.unit;
                break;
            case ProductType.Subscription:
                this.requestInfo.optionId = this.selectedSubscriptionOption.id;
                this.requestInfo.unit = PaymentService.getProductMeasurementUnit(this.selectedSubscriptionOption.frequency);
                break;
        }

        this.requestInfo.successUrl = `${AppConsts.appBaseUrl}/receipt/${this.tenantId}/{initialInvoiceXref}`;
        this.requestInfo.cancelUrl = location.href;

        return this.publicProductService.submitProductRequest(this.requestInfo).pipe(
            tap(v => { this.initialInvoiceXref = v.initialInvoicePublicId })
        );
    }

    onPayPalApprove() {
        location.href = this.getReceiptUrl();
    }

    getReceiptUrl() {
        return `${AppConsts.appBaseUrl}/receipt/${this.tenantId}/${this.initialInvoiceXref}`;
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

        let periods: RecurringPaymentFrequency[] = this.productInfo.productSubscriptionOptions.map(v => v.frequency);

        let billingPeriods = periods.map(v => PaymentService.getBillingPeriodByPaymentFrequency(v));
        this.availablePeriods = [];
        SingleProductComponent.availablePeriodsOrder.forEach(v => {
            if (billingPeriods.indexOf(v) >= 0)
                this.availablePeriods.push(v);
        });
        this.toggle(this.availablePeriods[0]);
    }

    checkIsFree() {
        switch (this.productInfo.type) {
            case ProductType.General:
            case ProductType.Digital:
                this.isFreeProductSelected = this.productInfo.price == 0;
                break;
            case ProductType.Subscription:
                this.isFreeProductSelected = this.selectedSubscriptionOption.fee == 0;
                break;
        }
    }

    getActiveStatus(period: BillingPeriod) {
        return this.selectedBillingPeriod == period;
    }

    toggle(value: BillingPeriod) {
        this.selectedBillingPeriod = value;
        this.updateSelectedSubscriptionOption();
        this.updateSubscriptionOptionPaypalButton();
        this.checkIsFree();
    }

    getSliderValue(): number {
        var periodIndex = this.availablePeriods.findIndex(v => v == this.selectedBillingPeriod);
        var value = periodIndex * (100 / this.availablePeriods.length);
        return +value.toFixed();
    }

    updateSelectedSubscriptionOption() {
        this.selectedSubscriptionOption = this.productInfo.productSubscriptionOptions.find(v => v.frequency == PaymentService.getRecurringPaymentFrequency(this.selectedBillingPeriod));
    }

    updateSubscriptionOptionPaypalButton() {
        this.paypalButtonType = this.selectedBillingPeriod == BillingPeriod.OneTime || this.selectedBillingPeriod == BillingPeriod.LifeTime ?
            ButtonType.Payment :
            ButtonType.Subscription;
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
        } else if (this.selectedBillingPeriod == BillingPeriod.OneTime) {
            return this.ls.l('price' + BillingPeriod[this.selectedBillingPeriod], this.selectedSubscriptionOption.customPeriodCount);
        } else {
            return this.ls.l('price' + BillingPeriod[this.selectedBillingPeriod]);
        }
    }

    changeQuantity(quantity: number) {
        this.requestInfo.quantity = quantity;
    }
}
