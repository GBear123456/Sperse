/** Core imports */
import { Component, ElementRef, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

/** Application imports */
import { ChangePasswordInput, PasswordComplexitySetting, ProfileServiceProxy } from '@shared/service-proxies/service-proxies';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
    selector: 'changePasswordModal',
    templateUrl: './change-password-modal.component.html',
    providers: [ DialogService ]
})
export class ChangePasswordModalComponent implements OnInit {

    @ViewChild('currentPasswordInput') currentPasswordInput: ElementRef;
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    currentPassword = '';
    password = '';
    confirmPassword = '';
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('SaveAndClose'),
            class: 'primary menu',
            action: this.save.bind(this)
        }
    ];
    constructor(
        public dialog: MatDialog,
        private _profileService: ProfileServiceProxy,
        private _changeDetectorRef: ChangeDetectorRef,
        private _notifyService: NotifyService,
        private _dialogRef: MatDialogRef<ChangePasswordModalComponent>,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this._profileService.getPasswordComplexitySetting().subscribe(result => {
            this.passwordComplexitySetting = result.setting;
            this._changeDetectorRef.detectChanges();
        });
    }

    save(): void {
        let input = new ChangePasswordInput();
        input.currentPassword = this.currentPassword;
        input.newPassword = this.password;
        this._profileService.changePassword(input)
            .subscribe(() => {
                this._notifyService.info(this.ls.l('YourPasswordHasChangedSuccessfully'));
                this._dialogRef.close();
            });
    }
}
