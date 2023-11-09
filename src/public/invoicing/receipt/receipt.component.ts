/** Core imports */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GetInvoiceReceiptInfoOutput, InvoiceStatus, 
    UserInvoiceServiceProxy } from '@root/shared/service-proxies/service-proxies';

/** Third party imports */
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { ConditionsType } from '@shared/AppEnums';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'public-receipt',
    templateUrl: 'receipt.component.html',
    styleUrls: [
        '../../../shared/common/styles/core.less',
        './receipt.component.less'
    ],
    encapsulation: ViewEncapsulation.None
})
export class ReceiptComponent implements OnInit {
    loading: boolean = true;
    invoiceInfo: GetInvoiceReceiptInfoOutput;
    returnText: string = '';
    hostName = AppConsts.defaultTenantName;
    currentYear: number = new Date().getFullYear();
    hasToSOrPolicy: boolean = AppConsts.isSperseHost;
    conditions = ConditionsType;

    static retryDelay: number = 4000;
    static maxRetryCount: number = 15;
    currentRetryCount: number = 0;
    failedToLoad: boolean = false;
    failMessage: string = '';

    tenantId: any = this.activatedRoute.snapshot.paramMap.get('tenantId');
    publicId = this.activatedRoute.snapshot.paramMap.get('publicId');


    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        public ls: AppLocalizationService,
        private userInvoiceService: UserInvoiceServiceProxy,
        private clipboardService: ClipboardService,
        public conditionsModalService: ConditionsModalService
    ) {
    }

    ngOnInit(): void {
        abp.ui.setBusy();
        this.getInvoiceInfo(this.tenantId, this.publicId);
    }

    getInvoiceInfo(tenantId, publicId) {
        this.userInvoiceService
            .getInvoiceReceiptInfo(tenantId, publicId)
            .subscribe(result => {
                switch (result.invoiceStatus) {
                    case InvoiceStatus.Sent:
                        {
                            if (result.waitingForFutureSubscriptionPayment) {
                                this.router.navigate(['invoicing/invoice', tenantId, publicId]);
                                return;
                            }

                            this.retryDataRequest(tenantId, publicId);
                            return;
                        }
                    case InvoiceStatus.Paid:
                        {
                            this.invoiceInfo = result;
                            this.setReturnLinkInfo();
                            this.loading = false;
                            abp.ui.clearBusy();
                            return;
                        }
                    default:
                        {
                            this.retryDataRequest(tenantId, publicId);
                            return;
                        }
                }
            });
    }

    retryDataRequest(tenantId, publicId) {
        this.currentRetryCount++;
        if (this.currentRetryCount >= ReceiptComponent.maxRetryCount) {
            abp.ui.clearBusy();
            this.failedToLoad = true;
            this.failMessage = 'Failed to load payment information. Please refresh the page or try again later.';
        }
        else {
            setTimeout(() => this.getInvoiceInfo(tenantId, publicId), ReceiptComponent.retryDelay);
        }
    }

    setReturnLinkInfo() {
        if (!this.invoiceInfo.isTenantInvoice)
            return;

        this.returnText = abp.session.userId ?
            'Return to System' :
            'Login to System';
    }

    returnLinkClick() {
        abp.ui.setBusy();
        if (abp.session.userId) {
            window.location.href = location.origin + '/app/crm';
        }
        else {
            sessionStorage.setItem('redirectUrl', `${location.origin}/app/crm`);
            window.location.href = location.origin + '/account/login';
        }
    }

    openConditionsDialog(type: ConditionsType) {
        this.conditionsModalService.openModal({
            panelClass: ['slider', 'footer-slider'],
            data: {
                type: type,
                onlyHost: true
            }
        });
    }

    resourceClick(event, resource: any) {
        if (resource.url) {
            this.clipboardService.copyFromContent(resource.url);
            abp.notify.info(this.ls.l('SavedToClipboard'));
        } else {
            if (resource.fileUrl)
                window.open(resource.fileUrl, '_blank');
            else
                this.userInvoiceService.getInvoiceResourceUrl(this.tenantId, this.publicId, resource.id).subscribe(url => {
                    resource.fileUrl = url;
                    window.open(url, '_blank');
                });
        }

        event.stopPropagation();
        event.preventDefault();
    }
}
