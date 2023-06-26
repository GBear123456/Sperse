/** Core imports */
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { SettingService } from 'abp-ng2-module';
import { NotifyService } from 'abp-ng2-module';

/** Application imports */
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ContditionsModalData } from '../../../shared/common/conditions-modal/conditions-modal-data';
import { GetPublicInvoiceInfoOutput, UserInvoiceServiceProxy, InvoiceStatus, PayPalServiceProxy, InvoicePaypalPaymentInfo } from '@root/shared/service-proxies/service-proxies';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PayPalComponent } from './pay-pal/pay-pal.component';
import { InvoiceDueStatus } from '@app/crm/invoices/invoices-dto.interface';
import { InvoiceHelpers } from '@app/crm/invoices/invoices.helper';

@Component({
    selector: 'public-invoice',
    templateUrl: 'invoice.component.html',
    styleUrls: [
        './invoice.component.less'
    ],
    encapsulation: ViewEncapsulation.None,
    providers: [
        PayPalServiceProxy
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
    currentYear: number = new Date().getFullYear();
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
        private userInvoiceService: UserInvoiceServiceProxy,
        private paypalServiceProxy: PayPalServiceProxy,
        private dialog: MatDialog,
        private clipboard: Clipboard,
        private setting: SettingService,
        private notifyService: NotifyService,
        private ls: AppLocalizationService
    ) {
    }

    ngOnInit(): void {
        this.tenantId = +this.route.snapshot.paramMap.get('tenantId');
        this.publicId = this.route.snapshot.paramMap.get('publicId');
        this.getInvoiceInfo();
        this.getPayPalInfo();
    }

    getInvoiceInfo() {
        abp.ui.setBusy();
        this.userInvoiceService
            .getPublicInvoiceInfo(this.tenantId, this.publicId)
            .pipe(
                finalize(() => abp.ui.clearBusy())
            )
            .subscribe(result => {
                this.loading = false;
                this.invoiceInfo = result;
                this.setDueInfo(result);
                this.showPaymentAdvice = !!(result.paymentSettings && (result.paymentSettings.bankAccountNumber ||
                    result.paymentSettings.bankRoutingNumberForACH ||
                    result.paymentSettings.bankRoutingNumber));
                this.showSubsScheduledMessage = this.invoiceInfo.invoiceData.status != InvoiceStatus.Paid && this.invoiceInfo.futureSubscriptionIsSetUp;
            });
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

    onPayPalApprove() {
        this.router.navigate(['/receipt', this.tenantId, this.publicId]);
    }

    getPayPalInfo() {
        this.paypalServiceProxy.getPaymentInfo(this.tenantId, this.publicId)
            .subscribe(res => {
                this.payPalInfo = res;
                this.initializePayPal();
            });
    }

    initializePayPal() {
        if (this.payPalInfo && this.payPal) {
            this.payPal.initialize(this.tenantId, this.publicId, this.payPalInfo)
        }
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
        this.dialog.open<ConditionsModalComponent, ContditionsModalData>(ConditionsModalComponent, {
            panelClass: ['slider', 'footer-slider'],
            data: {
                type: type,
                onlyHost: true
            }
        });
    }
}
