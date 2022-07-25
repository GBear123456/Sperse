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

    static maxRetryCount: number = 10;
    currentRetryCount: number = 0;
    failedToLoad: boolean = false;

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
                    this.currentRetryCount++;
                    if (this.currentRetryCount >= ReceiptComponent.maxRetryCount) {
                        abp.ui.clearBusy();
                        this.failedToLoad = true;
                    }
                    else {
                        setTimeout(() => this.getInvoiceInfo(tenantId, publicId), 4000);
                    }

                    return;
                }
                this.invoiceInfo = result;
                this.loading = false;
                abp.ui.clearBusy();
            });
    }
}
