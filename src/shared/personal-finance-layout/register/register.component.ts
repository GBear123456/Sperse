/** Core imports */
import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Observable } from 'rxjs';
import { first, filter, switchMap } from 'rxjs/operators';
import swal from 'sweetalert';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import {FinalizeApplicationResponse, FinalizeApplicationStatus,
    GetMemberInfoResponse,
    OfferServiceProxy
} from '@shared/service-proxies/service-proxies';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppConsts } from '@shared/AppConsts';
import { ApplyOfferDialogComponent } from '@root/personal-finance/shared/offers/apply-offer-modal/apply-offer-dialog.component';

@Component({
    selector: 'register',
    templateUrl: 'register.component.html',
    styleUrls: [
        '../../../personal-finance/shared/common/styles/apply-button.less',
        './register.component.less'
    ]
})

export class RegisterComponent implements OnInit {
    applicationCompleteIsRequired$: Observable<Boolean> = this.offersService.applicationCompleteIsRequired$;
    getMoreOptionsLink = '/personal-finance/offers/post-offers';
    constructor(
        private offersService: OffersService,
        private offerServiceProxy: OfferServiceProxy,
        private loadingService: LoadingService,
        private dialog: MatDialog,
        @Inject(DOCUMENT) private document: any
    ) {}

    ngOnInit() {
        this.applicationCompleteIsRequired$.pipe(
            filter(Boolean),
            first()
        ).subscribe(() => {
            this.showRegisterPopup();
        });
    }

    showRegisterPopup() {
        this.offersService.memberInfo$
            .pipe(first())
            .subscribe((memberInfo: GetMemberInfoResponse) => {
                const messageContent = {
                    title: memberInfo.firstName + ', please click below to',
                    button: {
                        text: 'Get approved',
                        className: 'applyButton',
                        closeModal: true
                    },
                    className: 'finalize',
                    content: this.document.getElementById('registerPopup').cloneNode(true)
                };
                messageContent['content'].style.display = 'block';
                swal(messageContent).then((result) => {
                    if (result) {
                        this.register();
                    }
                });
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
            width: '530px',
            panelClass: 'apply-offer-dialog',
            data: modalData
        });

        this.offersService.incompleteApplicationId$.pipe(
            first(),
            filter(Boolean),
            switchMap((applicationId: number) => this.offerServiceProxy.finalizeApplication(applicationId))
        ).subscribe(
            (response: FinalizeApplicationResponse) => {
                if (response.status === FinalizeApplicationStatus.Approved) {
                    applyOfferDialog.close();
                    let messageContent = {
                        title: 'Congratulations',
                        button: false,
                        className: 'success',
                        icon: 'success',
                        content: this.document.getElementById('successPopup').cloneNode(true),
                        closeOnClickOutside: false,
                        closeOnEsc: false
                    };
                    messageContent['content'].style.display = 'block';
                    swal(messageContent);
                    setTimeout(() => {
                        if (window.open(response.redirectUrl, '_blank')) {
                            swal.close('confirm');
                        } else {
                            const redirectButton = messageContent['content'].querySelector('.redirect-link');
                            redirectButton.onclick = () => {
                                window.open(response.redirectUrl, '_blank');
                                swal.close('confirm');
                            };
                            redirectButton.style.display = 'block';
                        }
                    }, 1000);
                } else if (response.status === FinalizeApplicationStatus.Declined) {
                    let messageContent = {
                        title: 'We\'re sorry testing, but you have been declined',
                        button: {
                            text: 'Get more options',
                            value: true,
                            closeModal: true
                        },
                        className: 'failure',
                        content: this.document.getElementById('failurePopup').cloneNode(true)
                    };
                    messageContent.content.style.display = 'block';
                    swal(messageContent).then((res) => {
                        if (res) {
                            window.open(AppConsts.appBaseUrl + this.getMoreOptionsLink, '_self');
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
}
