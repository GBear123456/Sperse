/** Core imports */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ContditionsModalData } from '../../../shared/common/conditions-modal/conditions-modal-data';
import { GetPublicInvoiceInfoOutput, UserInvoiceServiceProxy, InvoiceStatus } from '@root/shared/service-proxies/service-proxies';
import { UrlHelper } from '@shared/helpers/UrlHelper';

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
    currentYear: number = new Date().getFullYear();
    conditions = ConditionsType;
    invoiceStatuses = InvoiceStatus;

    tenantId: number;
    publicId: string;

    constructor(
        private route: ActivatedRoute,
        private userInvoiceService: UserInvoiceServiceProxy,
        private dialog: MatDialog
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
