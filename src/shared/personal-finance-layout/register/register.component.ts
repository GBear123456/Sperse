/** Core imports */
import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { Observable } from 'rxjs';
import { first, filter, finalize, tap, switchMap } from 'rxjs/operators';
import swal from 'sweetalert';

/** Application imports */
import {
    FinalizeApplicationResponse, FinalizeApplicationStatus,
    GetMemberInfoResponse,
    OfferServiceProxy
} from '@shared/service-proxies/service-proxies';
import { OffersService } from '@root/personal-finance/shared/offers/offers.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';

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
    getMoreOptionsLink = 'personal-finance/offers/personal-loans';
    constructor(
        private offersService: OffersService,
        private offerServiceProxy: OfferServiceProxy,
        private loadingService: LoadingService,
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
        this.offersService.incompleteApplicationId$.pipe(
            first(),
            filter(Boolean),
            tap(() => this.loadingService.startLoading()),
            switchMap((applicationId: number) => this.offerServiceProxy.finalizeApplication(applicationId).pipe(
                finalize(() => this.loadingService.finishLoading())
            ))
        ).subscribe((response: FinalizeApplicationResponse) => {
            if (response.status === FinalizeApplicationStatus.Approved) {
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
                const successModal = swal(messageContent);
                setTimeout(() => swal.close('confirm'), 1000);
                successModal.then(() => {
                    /** Redirect to url from response */
                    window.open(response.redirectUrl, '_blank');
                });
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
                        /** @todo find out where to redirect in a case of decline */
                        window.open(this.getMoreOptionsLink, '_self');
                    }
                });
            }
            /** To hide complete header */
            this.offersService.setIncompleteApplicationId(null);
        });
    }
}
