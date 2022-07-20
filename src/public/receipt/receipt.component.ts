/** Core imports */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GetInvoiceReceiptInfoOutput, InvoiceStatus, UserInvoiceServiceProxy } from '@root/shared/service-proxies/service-proxies';

/** Third party imports */

/** Application imports */

@Component({
    selector: 'public-receipt',
    templateUrl: 'receipt.component.html',
    styleUrls: [
        './receipt.component.less'
    ]})
export class ReceiptComponent implements OnInit {
    loading: boolean = true;
    invoiceInfo: GetInvoiceReceiptInfoOutput;

    constructor(
        private route: ActivatedRoute,
        private userInvoiceService: UserInvoiceServiceProxy
    ) {
    }

    ngOnInit(): void {
        const tenantId: any = this.route.snapshot.paramMap.get('tenantId');
        const publicId = this.route.snapshot.paramMap.get('publicId');
        abp.ui.setBusy();
        this.getInvoiceInfo(tenantId, publicId);
    }

    getInvoiceInfo(tenantId, publicId)
    {
        this.userInvoiceService
            .getInvoiceReceiptInfo(tenantId, publicId)
            .subscribe(result => {
                if (result.invoiceStatus != InvoiceStatus.Paid)
                {
                    setTimeout(() => this.getInvoiceInfo(tenantId, publicId), 3000);
                    return;
                }
                this.invoiceInfo = result;
                this.loading = false;
                abp.ui.clearBusy();
            });
    }
}
