/** Core imports */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GetInvoiceReceiptInfoOutput, InvoiceStatus, UserInvoiceServiceProxy } from '@root/shared/service-proxies/service-proxies';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ContditionsModalData } from '../../shared/common/conditions-modal/conditions-modal-data';

@Component({
    selector: 'public-receipt',
    templateUrl: 'receipt.component.html',
    styleUrls: [
        '../../shared/common/styles/core.less',
        './receipt.component.less'
    ],
    encapsulation: ViewEncapsulation.None
})
export class ReceiptComponent implements OnInit {
    loading: boolean = true;
    invoiceInfo: GetInvoiceReceiptInfoOutput;
    currentYear: number = new Date().getFullYear();
    conditions = ConditionsType;

    static maxRetryCount: number = 10;
    currentRetryCount: number = 0;
    failedToLoad: boolean = false;
    failMessage: string = '';

    constructor(
        private route: ActivatedRoute,
        private userInvoiceService: UserInvoiceServiceProxy,
        private dialog: MatDialog
    ) {
    }

    ngOnInit(): void {
        const tenantId: any = this.route.snapshot.paramMap.get('tenantId');
        const publicId = this.route.snapshot.paramMap.get('publicId');
        abp.ui.setBusy();
        this.getInvoiceInfo(tenantId, publicId);
    }

    getInvoiceInfo(tenantId, publicId) {
        this.userInvoiceService
            .getInvoiceReceiptInfo(tenantId, publicId)
            .subscribe(result => {
                switch (result.invoiceStatus) {
                    case InvoiceStatus.Sent:
                        {
                            this.currentRetryCount++;
                            if (this.currentRetryCount >= ReceiptComponent.maxRetryCount) {
                                abp.ui.clearBusy();
                                this.failedToLoad = true;
                                this.failMessage = 'Failed to load payment information. Please refresh the page or try again later.';
                            }
                            else {
                                setTimeout(() => this.getInvoiceInfo(tenantId, publicId), 4000);
                            }
                            return;
                        }
                    case InvoiceStatus.Paid:
                        {
                            this.invoiceInfo = result;
                            this.loading = false;
                            abp.ui.clearBusy();
                            return;
                        }
                    default:
                        {
                            abp.ui.clearBusy();
                            this.failedToLoad = true;
                            this.failMessage = `Invoice in status ${result.invoiceStatus} could not be paid`;
                            return;
                        }
                }
            });
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
