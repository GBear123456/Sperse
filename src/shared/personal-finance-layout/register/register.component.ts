/** Core imports */
import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

/** Third party imports */
import { MatDialog } from '@angular/material';
import { Observable } from 'rxjs';
import { first, filter, switchMap } from 'rxjs/operators';
import swal from 'sweetalert';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import { FinalizeApplicationResponse, FinalizeApplicationStatus, GetMemberInfoResponse, OfferServiceProxy } from '@shared/service-proxies/service-proxies';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppConsts } from '@shared/AppConsts';
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
                this.sendDecisionToLS(response.status);
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
                    messageContent['content'].querySelector('.redirect-link').onclick = () => {
                        window.open(response.redirectUrl, '_blank');
                        this.completeApprove(swal);
                    };
                    setTimeout(() => {
                        if (window.open(response.redirectUrl, '_blank')) {
                            this.completeApprove(swal);
                        }
                    }, 8000);
                } else if (response.status === FinalizeApplicationStatus.Declined) {
                    let messageContent = {
                        title: `We\'re sorry ${this.firstName}, but you have been declined`,
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
        modal.close('confirm');
        return this.router.navigate(['/personal-finance/offers/personal-loans']);
    }

    private sendDecisionToLS(status: FinalizeApplicationStatus) {
        if (this.clickId) {
            const evt = status === FinalizeApplicationStatus.Approved ? 'LSAP' : 'LSDP';
            this.http.get(`https://offer.lendspace.com/pxl.php?rxid=${this.clickId}&tdat=&evt=${evt}`).subscribe();
        }
    }
}
