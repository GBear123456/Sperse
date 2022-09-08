/** Core imports */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {  GetPublicInvoiceInfoOutput, UserInvoiceServiceProxy } from '@root/shared/service-proxies/service-proxies';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { ConditionsType } from '@shared/AppEnums';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ContditionsModalData } from '../../../shared/common/conditions-modal/conditions-modal-data';

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
            .getPublicInvoiceInfo(tenantId, publicId)
            .pipe(
                finalize(() => abp.ui.clearBusy())
            )
            .subscribe(result => {
                this.loading = false;
                this.invoiceInfo = result;
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
