/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

/** Third party imports */
import { MatDialogRef } from '@angular/material';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LinkToUserInput, UserLinkServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';

@Component({
    selector: 'linkAccountModal',
    templateUrl: './link-account-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkAccountModalComponent implements AfterViewInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild('linkAccountForm') linkAccountForm;
    @ViewChild('tenancyNameInput') tenancyNameInput: ElementRef;
    linkUser: LinkToUserInput = new LinkToUserInput();
    buttons: IDialogButton[];

    constructor(
        private _userLinkService: UserLinkServiceProxy,
        private _sessionAppService: AppSessionService,
        private _notifyService: NotifyService,
        private changeDetectorRef: ChangeDetectorRef,
        private _dialogRef: MatDialogRef<LinkAccountModalComponent>,
        public ls: AppLocalizationService
    ) {
        this.linkUser = new LinkToUserInput();
        this.linkUser.tenancyName = this._sessionAppService.tenancyName;
    }

    ngAfterViewInit() {
        this.buttons = [{
            title: this.ls.l('Save'),
            disabled: !this.linkAccountForm.form.valid,
            class: 'primary',
            action: this.save.bind(this)
        }];
        this.changeDetectorRef.markForCheck();
    }

    save(): void {
        this.modalDialog.startLoading();
        this._userLinkService.linkToUser(this.linkUser)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this._dialogRef.close();
            });
    }

}
