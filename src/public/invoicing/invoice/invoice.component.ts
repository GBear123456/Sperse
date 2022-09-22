/** Core imports */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { NotifyService } from 'abp-ng2-module';

/** Application imports */
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ContditionsModalData } from '../../../shared/common/conditions-modal/conditions-modal-data';
import { GetPublicInvoiceInfoOutput, UserInvoiceServiceProxy, InvoiceStatus } from '@root/shared/service-proxies/service-proxies';
import { UrlHelper } from '@shared/helpers/UrlHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'public-invoice',
    templateUrl: 'invoice.component.html',
    styleUrls: [
        './invoice.component.less'
    ],
    encapsulation: ViewEncapsulation.None
})
export class InvoiceComponent implements OnInit {
    loading: boolean = true;
    invoiceInfo: GetPublicInvoiceInfoOutput;
    showPaymentAdvice = false;
    currentYear: number = new Date().getFullYear();
    conditions = ConditionsType;
    invoiceStatuses = InvoiceStatus;

    tenantId: number;
    publicId: string;

    constructor(
        private route: ActivatedRoute,
        private userInvoiceService: UserInvoiceServiceProxy,
        private dialog: MatDialog,
        private clipboard: Clipboard,
        private notifyService: NotifyService,
        private ls: AppLocalizationService
    ) {
    }

    ngOnInit(): void {
        this.tenantId = +this.route.snapshot.paramMap.get('tenantId');
        this.publicId = this.route.snapshot.paramMap.get('publicId');
        this.getInvoiceInfo();
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
                this.showPaymentAdvice = !!(result.paymentSettings && (result.paymentSettings.bankAccountNumber ||
                    result.paymentSettings.bankRoutingNumberForACH ||
                    result.paymentSettings.bankRoutingNumber));
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
        this.dialog.open<ConditionsModalComponent, ContditionsModalData>(ConditionsModalComponent, {
            panelClass: ['slider', 'footer-slider'],
            data: {
                type: type,
                onlyHost: true
            }
        });
    }
}
