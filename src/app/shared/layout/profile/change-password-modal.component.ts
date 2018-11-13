import { Component, ElementRef, Injector, ViewChild, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ChangePasswordInput, PasswordComplexitySetting, ProfileServiceProxy } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'changePasswordModal',
    templateUrl: './change-password-modal.component.html',
    providers: [DialogService]
})
export class ChangePasswordModalComponent extends ModalDialogComponent implements OnInit {

    @ViewChild('currentPasswordInput') currentPasswordInput: ElementRef;

    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    currentPassword: string;
    password: string;
    confirmPassword: string;

    saving = false;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _profileService: ProfileServiceProxy
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
    }

    ngOnInit() {
        super.ngOnInit();

        this.data.title = this.l("ChangePassword");
        this.data.editTitle = false;
        this.data.titleClearButton = false;
        this.data.placeholder = this.l('ChangePassword');

        this.data.buttons = [{
            title: this.l('SaveAndClose'),
            class: 'primary menu',
            action: this.save.bind(this)
        }];
        
        this.currentPassword = '';
        this.password = '';
        this.confirmPassword = '';

        this._profileService.getPasswordComplexitySetting().subscribe(result => {
            this.passwordComplexitySetting = result.setting;
        });
    }

    save(): void {
        let input = new ChangePasswordInput();
        input.currentPassword = this.currentPassword;
        input.newPassword = this.password;

        this.saving = true;
        this._profileService.changePassword(input)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.notify.info(this.l('YourPasswordHasChangedSuccessfully'));
                this.close();
            });
    }
}
