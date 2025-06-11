/** Core imports */
import { Component, NgZone, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';

/** Third party imports */
import { finalize } from 'rxjs/operators';
import { SettingService } from 'abp-ng2-module';
import { NotifyService } from 'abp-ng2-module';
import { forkJoin } from 'rxjs';

/** Application imports */
import { ConditionsType } from '@shared/AppEnums';
import { GetPublicInvoiceInfoOutput, UserInvoiceServiceProxy, InvoiceStatus, PayPalServiceProxy, InvoicePaypalPaymentInfo, SpreedlyServiceProxy, SpreedlyInvoiceChargeInput } from '@root/shared/service-proxies/service-proxies';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PayPalComponent } from '@shared/common/paypal/paypal.component';
import { ButtonType } from '@shared/common/paypal/button-type.enum';
import { InvoiceDueStatus } from '@app/crm/invoices/invoices-dto.interface';
import { InvoiceHelpers } from '@app/crm/invoices/invoices.helper';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';
import { AppConsts } from '@shared/AppConsts';
import { SpreedlyPayButtonsComponent } from '@shared/common/spreedly-pay-buttons/spreedly-pay-buttons.component';

@Component({
    selector: 'public-invoice',
    templateUrl: 'invoice.component.html',
    styleUrls: [
        './invoice.component.less'
    ],
    encapsulation: ViewEncapsulation.None,
    providers: [
        PayPalServiceProxy, SpreedlyServiceProxy
    ]
})
export class InvoiceComponent implements OnInit {
    private payPal: PayPalComponent;
    @ViewChild(PayPalComponent) set paypPalComponent(paypalComp: PayPalComponent) {
        this.payPal = paypalComp;
        this.initializePayPal();
    };

    loading: boolean = true;
    invoiceInfo: GetPublicInvoiceInfoOutput;
    showPaymentAdvice = false;
    hostName = AppConsts.defaultTenantName;
    currentYear: number = new Date().getFullYear();
    hasToSOrPolicy: boolean;
    conditions = ConditionsType;
    invoiceStatuses = InvoiceStatus;

    dueStatus: InvoiceDueStatus;
    dueStatusMessage;

    showSubsScheduledMessage: boolean = false;

    tenantId: number;
    publicId: string;

    payPalInfo: InvoicePaypalPaymentInfo;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ngZone: NgZone,
        private userInvoiceService: UserInvoiceServiceProxy,
        private paypalServiceProxy: PayPalServiceProxy,
        private spreedlyService: SpreedlyServiceProxy,
        private clipboard: Clipboard,
        private setting: SettingService,
        private notifyService: NotifyService,
        private ls: AppLocalizationService,
        public conditionsModalService: ConditionsModalService
    ) {
    }

    ngOnInit(): void {
        this.tenantId = +this.route.snapshot.paramMap.get('tenantId');
        this.publicId = this.route.snapshot.paramMap.get('publicId');

        abp.ui.setBusy();
        forkJoin([
            this.userInvoiceService.getPublicInvoiceInfo(this.tenantId, this.publicId),
            this.paypalServiceProxy.getPaymentInfo(this.tenantId, this.publicId)
        ])
            .pipe(finalize(() => abp.ui.clearBusy()))
            .subscribe(([invoiceInfo, paypalInfo]) => {
                this.loading = false;
                this.setInvoiceInfo(invoiceInfo);
                this.setPayPalInfo(paypalInfo);
            });
    }

    setInvoiceInfo(invoiceInfo: GetPublicInvoiceInfoOutput) {
        this.invoiceInfo = invoiceInfo;
        this.setDueInfo(invoiceInfo);
        this.showPaymentAdvice = !!(invoiceInfo.paymentSettings && (invoiceInfo.paymentSettings.bankAccountNumber ||
            invoiceInfo.paymentSettings.bankRoutingNumberForACH ||
            invoiceInfo.paymentSettings.bankRoutingNumber));
        this.showSubsScheduledMessage = this.invoiceInfo.invoiceData.status != InvoiceStatus.Paid && this.invoiceInfo.futureSubscriptionIsSetUp;

        this.hasToSOrPolicy = this.invoiceInfo.tenantHasTerms || this.invoiceInfo.tenantHasPrivacyPolicy;
    }

    setDueInfo(invoiceInfo: GetPublicInvoiceInfoOutput) {
        let invoiceDueInfo = InvoiceHelpers.getDueInfo(invoiceInfo.invoiceData.status,
            this.setting.getInt('Invoice:DueGracePeriod'),
            invoiceInfo.invoiceData.dueDate,
            invoiceInfo.invoiceData.date,
            invoiceInfo.futureSubscriptionIsSetUp,
            (key, ...args) => this.ls.l(key, args))

        if (invoiceDueInfo == null)
            return;

        if ([InvoiceDueStatus.Due, InvoiceDueStatus.Overdue].indexOf(invoiceDueInfo.status) < 0)
            return;

        this.dueStatus = invoiceDueInfo.status;
        this.dueStatusMessage = invoiceDueInfo.message;
    }

    redirectToReceipt() {
        this.router.navigate(['/receipt', this.tenantId, this.publicId]);
    }

    setPayPalInfo(payPalInfo: InvoicePaypalPaymentInfo) {
        this.payPalInfo = payPalInfo;
        this.initializePayPal();
    }

    initializePayPal() {
        if (this.payPalInfo && this.payPal && this.payPalInfo.isApplicable && !this.payPal.initialized) {
            let type = this.payPalInfo.isSubscription ? ButtonType.Subscription : ButtonType.Payment;
            this.payPal.initialize(this.payPalInfo.clientId, type,
                () => this.paypalServiceProxy.requestPayment(this.tenantId, this.publicId).toPromise(),
                () => this.paypalServiceProxy.requestSubscription(this.tenantId, this.publicId).toPromise(),
                this.invoiceInfo.invoiceData.currencyId
            );
        }
    }

    onSpreedlyClick(event) {
        let spreedlyComponent: SpreedlyPayButtonsComponent = event.component;
        let displayOptions = {
            amount: this.invoiceInfo.invoiceData.grandTotal.toFixed(2) + ' ' + this.invoiceInfo.invoiceData.currencyId,
            company_name: this.invoiceInfo.legalName,
            sidebar_top_description: 'Invoice Number: ' + this.invoiceInfo.invoiceData.number,
            sidebar_bottom_description: this.invoiceInfo.invoiceData.description?.substr(0, 150),
            full_name: this.invoiceInfo.invoiceData.customerName
        };
        let paymentMethodParams = {
        };
        spreedlyComponent.showBankCardPopup(event.providerId, displayOptions, paymentMethodParams);
    }

    onSpreedlyPaymentMethod(event) {
        abp.ui.setBusy();
        this.spreedlyService.charge(new SpreedlyInvoiceChargeInput({
            tenantId: this.tenantId,
            invoicePublicId: this.publicId,
            paymentGatewayTokenId: event.providerId,
            paymentMethodToken: event.token
        })).pipe(
            finalize(() => abp.ui.clearBusy())
        ).subscribe(res => {
            if (res.errorMessage) {
                abp.message.error(res.errorMessage);
            } else {
                this.ngZone.run(() => this.redirectToReceipt());
            }
        });
    }

    downloadInvoice() {
        abp.ui.setBusy();
        this.userInvoiceService
            .getInvoicePdfUrl(this.tenantId, this.publicId)
            .pipe(
                finalize(() => abp.ui.clearBusy())
            )
            .subscribe(pdfUrl => {
                UrlHelper.downloadFileFromUrl(pdfUrl, this.invoiceInfo.invoiceData.number + '.pdf');
            });
    }

    printPage() {
        window.print();
    }

    copyInvoiceNumer() {
        this.clipboard.copy(this.invoiceInfo.invoiceData.number);
        this.notifyService.info(this.ls.l('SavedToClipboard'));
    }

    openConditionsDialog(type: ConditionsType) {
        this.conditionsModalService.openModal({
            panelClass: ['slider', 'footer-slider'],
            data: {
                type: type,
                tenantId: this.tenantId,
                hasOwnDocument: type == ConditionsType.Terms ? this.invoiceInfo.tenantHasTerms : this.invoiceInfo.tenantHasPrivacyPolicy
            }
        });
    }
}
