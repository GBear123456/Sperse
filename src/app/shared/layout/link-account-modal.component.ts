/** Core imports */
import { Component, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialogRef } from '@angular/material';

/** Application imports */
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LinkToUserInput, UserLinkServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
    selector: 'linkAccountModal',
    templateUrl: './link-account-modal.component.html'
})
export class LinkAccountModalComponent {
    @ViewChild('tenancyNameInput') tenancyNameInput: ElementRef;

    linkUser: LinkToUserInput = new LinkToUserInput();

    constructor(
        private _userLinkService: UserLinkServiceProxy,
        private _sessionAppService: AppSessionService,
        private _notifyService: NotifyService,
        private _dialogRef: MatDialogRef<LinkAccountModalComponent>,
        public ls: AppLocalizationService
    ) {
        this.linkUser = new LinkToUserInput();
        this.linkUser.tenancyName = this._sessionAppService.tenancyName;
    }

    save(): void {
        this._userLinkService.linkToUser(this.linkUser)
            .subscribe(() => {
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this._dialogRef.close();
            });
    }

}
