/** Core imports */
import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Observable } from 'rxjs';
import { finalize, first, filter, map, switchMap } from 'rxjs/operators';
import swal from 'sweetalert';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import { FinalizeApplicationResponse, FinalizeApplicationStatus, GetMemberInfoResponse, OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ApplyOfferDialogComponent } from '@root/personal-finance/shared/offers/apply-offer-modal/apply-offer-dialog.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'register',
    templateUrl: 'register.component.html',
    styleUrls: [
        '../../../personal-finance/shared/common/styles/apply-button.less',
        './register.component.less'
    ]
})
export class RegisterComponent implements AfterViewInit, OnInit {
    applicationCompleteIsRequired$: Observable<Boolean> = this.offersService.applicationCompleteIsRequired$;
    getMoreOptionsLink = '/personal-finance/offers/post-offers';
    firstName: string;
    clickId: string;
    constructor(
        private offersService: OffersService,
        private offerServiceProxy: OfferServiceProxy,
        private loadingService: LoadingService,
        private dialog: MatDialog,
        private router: Router,
        private http: HttpClient,
        public ls: AppLocalizationService,
        @Inject(DOCUMENT) private document: any
    ) {}

    ngOnInit() {
        this.offersService.memberInfo$.pipe(first()).subscribe((memberInfo: GetMemberInfoResponse) => {
            this.firstName = memberInfo.firstName;
            this.clickId = memberInfo.clickId;
        });
    }

    ngAfterViewInit() {
        this.applicationCompleteIsRequired$.pipe(
            filter(Boolean),
            first()
        ).subscribe(() => {
            this.showRegisterPopup();
        });
    }

    showRegisterPopup() {
        const messageContent = {
            button: {
                text: 'Get approved',
                className: 'applyButton',
                closeModal: true
            },
            className: 'finalize',
            closeOnClickOutside: false,
            closeOnEsc: false,
            content: this.document.getElementById('registerPopup').cloneNode(true)
        };
        messageContent['content'].style.display = 'block';
        swal(messageContent).then((result) => {
            if (result) {
                this.register();
            }
        });
    }

    private register() {
        const modalData = {
            processingSteps: cloneDeep(this.offersService.processingSteps),
            completeDelays: [ 1000, 1000, 1000, null ],
            delayMessages: null,
            title: 'Offers_ConnectingToPartners',
            subtitle: 'Offers_NewWindowWillBeOpen',
            redirectUrl: null,
            logoUrl: null
        };
        const applyOfferDialog = this.dialog.open(ApplyOfferDialogComponent, {
            width: '577px',
            height: '330px',
            disableClose: true,
            panelClass: 'apply-offer-dialog',
            data: modalData
        });
        this.offersService.incompleteApplicationId$.pipe(
            first(),
            filter(Boolean),
            switchMap((applicationId: number) => this.offerServiceProxy.finalizeApplication(applicationId))
        ).subscribe(
            (response: FinalizeApplicationResponse) => {
                this.sendDecisionToLS(response.status);
                if (response.status === FinalizeApplicationStatus.Approved) {
                    applyOfferDialog.close();
                    let messageContent = {
                        button: {
                            text: 'Accept the loan offer',
                            className: 'applyButton',
                            closeModal: true
                        },
                        className: 'success',
                        content: this.document.getElementById('successPopup').cloneNode(true),
                        closeOnClickOutside: false,
                        closeOnEsc: false
                    };
                    messageContent['content'].style.display = 'block';
                    const autoRedirect = setTimeout(() => {
                        if (window.open(response.redirectUrl, '_blank')) {
                            this.completeApprove(swal);
                        }
                    }, 8000);
                    swal(messageContent).then((result) => {
                        if (result) {
                            clearTimeout(autoRedirect);
                            window.open(response.redirectUrl, '_blank');
                            this.completeApprove(swal);
                        }
                    });
                } else if (response.status === FinalizeApplicationStatus.Declined) {
                    let messageContent = {
                        button: {
                            text: 'Get more options',
                            value: true,
                            closeModal: true
                        },
                        className: 'failure',
                        closeOnClickOutside: false,
                        closeOnEsc: false,
                        content: this.document.getElementById('failurePopup').cloneNode(true)
                    };
                    messageContent.content.style.display = 'block';
                    swal(messageContent).then((res) => {
                        if (res) {
                            this.router.navigate([this.getMoreOptionsLink]);
                        }
                    });
                }
                /** To hide complete header */
                this.offersService.setIncompleteApplicationId(null);
                applyOfferDialog.close();
            },
            () => applyOfferDialog.close()
        );
    }

    private completeApprove(modal): Promise<boolean> {
        modal.close('cancel');
        return this.router.navigate(['/personal-finance/offers/personal-loans']);
    }

    private sendDecisionToLS(status: FinalizeApplicationStatus) {
        if (this.clickId) {
            const evt = status === FinalizeApplicationStatus.Approved ? 'LSAP' : 'LSDP';
            this.http.get(`https://offer.lendspace.com/pxl.php?rxid=${this.clickId}&tdat=&evt=${evt}`).subscribe();
        }
    }
}
