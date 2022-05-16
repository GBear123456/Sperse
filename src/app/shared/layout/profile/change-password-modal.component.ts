/** Core imports */
import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { ChangePasswordInput, PasswordComplexitySetting, ProfileServiceProxy } from '@shared/service-proxies/service-proxies';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { NotifyService } from 'abp-ng2-module';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'changePasswordModal',
    templateUrl: './change-password-modal.component.html',
    providers: [ DialogService ]
})
export class ChangePasswordModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    currentPassword = '';
    password = '';
    confirmPassword = '';
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('SaveAndClose'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];
    constructor(
        public dialog: MatDialog,
        private profileService: ProfileServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private notifyService: NotifyService,
        private dialogRef: MatDialogRef<ChangePasswordModalComponent>,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        this.profileService.getPasswordComplexitySetting()
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(result => {
                this.passwordComplexitySetting = result.setting;
                this.changeDetectorRef.detectChanges();
            });
    }

    save(): void {
        this.modalDialog.startLoading();
        let input = new ChangePasswordInput();
        input.currentPassword = this.currentPassword;
        input.newPassword = this.password;
        this.profileService.changePassword(input)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this.notifyService.info(this.ls.l('YourPasswordHasChangedSuccessfully'));
                this.dialogRef.close();
            });
    }
}
