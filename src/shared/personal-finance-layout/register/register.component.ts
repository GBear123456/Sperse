/** Core imports */
import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Third party imports */
import { first } from 'rxjs/operators';
import swal from 'sweetalert';

/** Application imports */
import { GetMemberInfoResponse } from '@shared/service-proxies/service-proxies';
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
    success = false;
    registerIsNecessary = true;
    constructor(
        private offersService: OffersService,
        private loadingService: LoadingService,
        @Inject(DOCUMENT) private document: any
    ) {}

    ngOnInit() {
        if (this.registerIsNecessary) {
            this.showRegisterPopup();
        }
    }

    showRegisterPopup() {
        this.offersService.memberInfo$
            .pipe(first())
            .subscribe((memberInfo: GetMemberInfoResponse) => {
                const messageContent = {
                    title: memberInfo.firstName + ', please click below to',
                    button: {
                        text: 'Get approved',
                        className: 'applyButton'
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

        /** Start spinner */
        this.loadingService.startLoading();

        this.success = !this.success;
        /** Delay for simulating finalizeApplication request */
        setTimeout(() => {
            this.loadingService.finishLoading();
            if (this.success) {
                let messageContent = {
                    title: 'Congratulations',
                    button: false,
                    className: 'success',
                    icon: 'success',
                    content: this.document.getElementById('successPopup').cloneNode(true)
                };
                messageContent['content'].style.display = 'block';
                const redirectUrl = 'https://www.lendspace.com';
                messageContent['content'].querySelector('.continue').onclick = () => {
                    swal.close('confirm');
                    window.open(redirectUrl, '_blank');
                };
                swal(messageContent);
                /** Redirect to the coming from api redirectUrl */
                setTimeout(() => {});
            } else {
                let messageContent = {
                    title: 'We\'re sorry testing, but you have been declined',
                    button: {
                        text: 'Get more options'
                    },
                    className: 'failure',
                    content: this.document.getElementById('failurePopup').cloneNode(true)
                };
                messageContent.content.style.display = 'block';
                swal(messageContent);
            }
        }, 1000);
    }
}
