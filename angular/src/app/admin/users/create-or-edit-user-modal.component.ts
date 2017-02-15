import { Component, ViewChild, Injector, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalDirective } from 'ng2-bootstrap';
import { UserServiceProxy, ProfileServiceProxy, UserEditDto, CreateOrUpdateUserInput, UserRoleDto } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';

import * as _ from "lodash";

@Component({
    selector: 'createOrEditUserModal',
    templateUrl: './create-or-edit-user-modal.component.html',
    styles: [
        `.user-edit-dialog-profile-image {
             margin-bottom: 20px;
        }`
    ]
})
export class CreateOrEditUserModalComponent extends AppComponentBase {

    @ViewChild('nameInput') nameInput: ElementRef;
    @ViewChild('createOrEditModal') modal: ModalDirective;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active: boolean = false;
    saving: boolean = false;
    canChangeUserName: boolean = true;
    isTwoFactorEnabled: boolean = this.setting.getBoolean("Abp.Zero.UserManagement.TwoFactorLogin.IsEnabled");
    isLockoutEnabled: boolean = this.setting.getBoolean("Abp.Zero.UserManagement.UserLockOut.IsEnabled");

    user: UserEditDto = new UserEditDto();
    roles: UserRoleDto[];
    sendActivationEmail: boolean = true;
    setRandomPassword: boolean = true;
    profilePicture: string;

    constructor(
        injector: Injector,
        private _userService: UserServiceProxy,
        private _profileService: ProfileServiceProxy
    ) {
        super(injector);
    }

    show(userId?: number): void {
        this.active = true;

        if (userId) {
            this.setRandomPassword = false;
            this.sendActivationEmail = false;
        }

        this._userService.getUserForEdit(userId).subscribe(result => {
            this.user = result.user;
            this.roles = result.roles;
            this.canChangeUserName = this.user.userName !== AppConsts.userManagement.defaultAdminUserName;

            this.getProfilePicture(result.profilePictureId);

            this.modal.show();
        });
    }

    getProfilePicture(profilePictureId: string): void {
        this._profileService.getProfilePictureById(profilePictureId).subscribe(result => {

            if (result && result.profilePicture) {
                this.profilePicture = 'data:image/jpeg;base64,' + result.profilePicture;
            } else {
                this.profilePicture = "/assets/common/images/default-profile-picture.png";
            }
        });
    }

    onShown(): void {
        $(this.nameInput.nativeElement).focus();
    }

    save(): void {
        var input = new CreateOrUpdateUserInput();

        input.user = this.user;
        input.setRandomPassword = this.setRandomPassword;
        input.sendActivationEmail = this.sendActivationEmail;
        input.assignedRoleNames =
            _.map(
                _.filter(this.roles, { isAssigned: true }), role => role.roleName
            );

        this.saving = true;
        this._userService.createOrUpdateUser(input)
            .finally(() => { this.saving = false; })
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
                this.modalSave.emit(null);
            });
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }

    getAssignedRoleCount(): number {
        return _.filter(this.roles, { isAssigned: true }).length;
    }
}