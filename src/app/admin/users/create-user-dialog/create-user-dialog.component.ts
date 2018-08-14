import { Component, OnInit, ViewChild, Injector } from '@angular/core';
import { Router } from '@angular/router';

import {
    UserServiceProxy, ProfileServiceProxy, UserEditDto, CreateOrUpdateUserInput,
    UserRoleDto, PasswordComplexitySetting, TenantHostType
} from '@shared/service-proxies/service-proxies';

import { AppConsts } from '@shared/AppConsts';
import { DxContextMenuComponent, DxTextBoxComponent } from 'devextreme-angular';

import { MatDialog } from '@angular/material';
import { ModalDialogComponent } from '@app/shared/common/dialogs/modal/modal-dialog.component';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { StringHelper } from '@shared/helpers/StringHelper';

import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';
import * as nameParser from 'parse-full-name';

import { OrganizationUnitsTreeComponent, IOrganizationUnitsTreeComponentData } from '../../shared/organization-unit-tree.component';
import { finalize } from 'rxjs/operators';

@Component({
    templateUrl: 'create-user-dialog.component.html',
    styleUrls: ['create-user-dialog.component.less'],
    providers: []
})
export class CreateUserDialogComponent extends ModalDialogComponent implements OnInit {
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;
    @ViewChild('organizationUnitTree') organizationUnitTree: OrganizationUnitsTreeComponent;
    @ViewChild('phoneNumber') phoneNumber: DxTextBoxComponent;

    user = new UserEditDto();
    roles: UserRoleDto[];
    sendActivationEmail = true;
    setRandomPassword = false;
    passwordComplexityInfo = '';
    canChangeUserName: boolean;

    isTwoFactorEnabled: boolean = this.setting.getBoolean('Abp.Zero.UserManagement.TwoFactorLogin.IsEnabled');
    isLockoutEnabled: boolean = this.setting.getBoolean('Abp.Zero.UserManagement.UserLockOut.IsEnabled');
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();

    private readonly SAVE_OPTION_DEFAULT = 1;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';

    saveButtonId = 'saveUserOptions';
    saveContextMenuItems = [];

    masks = AppConsts.masks;
    phoneRegEx = AppConsts.regexPatterns.phone;
    emailRegEx = AppConsts.regexPatterns.email;

    photoOriginalData: string;
    photoThumbnailData: string;

    toolbarConfig = [];

    constructor(
        injector: Injector,
        private _router: Router,
        public dialog: MatDialog,
        private _userService: UserServiceProxy,
        private _profileService: ProfileServiceProxy,
        private _cacheService: CacheService
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this._cacheService = this._cacheService.useStorage(AppConsts.CACHE_TYPE_LOCAL_STORAGE);

        this.saveContextMenuItems = [
            { text: this.l('SaveAndAddNew'), selected: false },
//            { text: this.l('SaveAndExtend'), selected: false, disabled: true },
            { text: this.l('SaveAndClose'), selected: false }
        ];

        this.userDataInit();
        this.initToolbarConfig();
    }

    userDataInit() {
        this._userService.getUserForEdit(undefined).subscribe(userResult => {
            this.user = userResult.user;
            this.roles = userResult.roles;
            this.canChangeUserName = this.user.userName !== AppConsts.userManagement.defaultAdminUserName;

            this.organizationUnitTree.data = <IOrganizationUnitsTreeComponentData>{
                allOrganizationUnits: userResult.allOrganizationUnits,
                selectedOrganizationUnits: userResult.memberedOrganizationUnits
            };

            this._profileService.getPasswordComplexitySetting().subscribe(passwordComplexityResult => {
                this.passwordComplexitySetting = passwordComplexityResult.setting;
                this.setPasswordComplexityInfo();
            });
        });
    }

    setPasswordComplexityInfo(): void {

        this.passwordComplexityInfo = '<ul>';

        if (this.passwordComplexitySetting.requireDigit) {
            this.passwordComplexityInfo += '<li>' + this.l('PasswordComplexity_RequireDigit_Hint') + '</li>';
        }

        if (this.passwordComplexitySetting.requireLowercase) {
            this.passwordComplexityInfo += '<li>' + this.l('PasswordComplexity_RequireLowercase_Hint') + '</li>';
        }

        if (this.passwordComplexitySetting.requireUppercase) {
            this.passwordComplexityInfo += '<li>' + this.l('PasswordComplexity_RequireUppercase_Hint') + '</li>';
        }

        if (this.passwordComplexitySetting.requireNonAlphanumeric) {
            this.passwordComplexityInfo += '<li>' + this.l('PasswordComplexity_RequireNonAlphanumeric_Hint') + '</li>';
        }

        if (this.passwordComplexitySetting.requiredLength) {
            this.passwordComplexityInfo += '<li>' + this.l('PasswordComplexity_RequiredLength_Hint', this.passwordComplexitySetting.requiredLength) + '</li>';
        }

        this.passwordComplexityInfo += '</ul>';
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'after', items: [
                    {
                        name: 'discard',
                        action: this.resetFullDialog.bind(this)
                    }
                ]
            }
        ];
    }

    saveOptionsInit() {
        let cacheKey = this.getCacheKey(this.SAVE_OPTION_CACHE_KEY),
            selectedIndex = this.SAVE_OPTION_DEFAULT;
        if (this._cacheService.exists(cacheKey))
            selectedIndex = this._cacheService.get(cacheKey);
        this.saveContextMenuItems[selectedIndex].selected = true;
        this.data.buttons[0].title = this.saveContextMenuItems[selectedIndex].text;
    }

    updateSaveOption(option) {
        this.data.buttons[0].title = option.text;
        this._cacheService.set(this.getCacheKey(this.SAVE_OPTION_CACHE_KEY),
            this.saveContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
    }

    ngOnInit() {
        super.ngOnInit();

        this.data.editTitle = true;
        this.data.titleClearButton = true;
        this.data.placeholder = this.l('Contact.FullName');
        this.data.buttons = [{
            id: this.saveButtonId,
            title: this.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this)
        }];
        this.saveOptionsInit();
    }

    private afterSave(userId): void {
        if (this.saveContextMenuItems[0].selected) {
            this.resetFullDialog();
            this.notify.info(this.l('SavedSuccessfully'));
            this.data.refreshParent(true);
//        } else if (this.saveContextMenuItems[1].selected) {
//            this.redirectToUserDetails(userId);
        } else {
            this.data.refreshParent();
            this.close();
        }
    }

    redirectToUserDetails(id: number) {
        setTimeout(() => {
            this._router.navigate([`app/admin/user/${id}/information`],
                { queryParams: { referrer: this._router.url.split('?').shift() } }
            );
        }, 1000);
        this.close();
    }

    validateForm() {
        if (!this.user.name || !this.user.surname)
            return this.notify.error(this.l('FullNameIsRequired'));

        if (this.user.emailAddress) {
            if (!this.validateEmailAddress(this.user.emailAddress))
                return this.notify.error(this.l('EmailIsNotValid'));
        } else
            return this.notify.error(this.l('EmailIsRequired'));

        if (!this.validatePhoneNumber(this.user.phoneNumber))
            return this.notify.error(this.l('PhoneValidationError'));

        if (!this.user.userName)
            return this.notify.error(this.l('InvalidUserNameOrPassword'));

        return true;
    }

    save(event?): void {
        if (event && event.offsetX > 195)
            return this.saveContextComponent
                .instance.option('visible', true);

        if (!this.validateForm())
            return;

        let saveButton: any = document.getElementById(this.saveButtonId);
        saveButton.disabled = true;

        let input = new CreateOrUpdateUserInput();

        input.user = this.user;
        input.setRandomPassword = this.setRandomPassword;
        input.sendActivationEmail = this.sendActivationEmail;
        input.assignedRoleNames =
            _.map(
                _.filter(this.roles, { isAssigned: true }), role => role.roleName
            );

        input.organizationUnits = this.organizationUnitTree.getSelectedOrganizations();
        input.profilePicture = StringHelper.getBase64(this.photoOriginalData);

        input.tenantHostType = <any>TenantHostType.PlatformUi;
        this._userService.createOrUpdateUser(input)
            .pipe(finalize(() => { saveButton.disabled = false; }))
            .subscribe((userId) => this.afterSave(userId || this.user.id));
    }

    getDialogPossition(event, shiftX) {
        return this.calculateDialogPosition(event, event.target.closest('div'), shiftX, -12);
    }

    getInputElementValue(event) {
        return event.element.getElementsByTagName('input')[0].value;
    }

    validateEmailAddress(value): boolean {
        return this.emailRegEx.test(value);
    }

    validatePhoneNumber(value): boolean {
        return this.phoneRegEx.test(value);
    }

    showUploadPhoto($event) {
        this.dialog.open(UploadPhotoDialogComponent, {
            data: {
                source: this.photoOriginalData,
                maxSizeBytes: 1048576
            },
            hasBackdrop: true
        }).afterClosed().subscribe((result) => {
            if (result) {
                this.photoOriginalData = result.origImage;
                this.photoThumbnailData = result.thumImage;
            }
        });
        $event.stopPropagation();
    }

    resetFullDialog() {
        this.data.title = '';
        this.setRandomPassword = false;
        this.sendActivationEmail = true;
        this.user = new UserEditDto();

        setTimeout(() =>
            this.setComponentToValid(
                this.phoneNumber.instance));
    }

    onSaveOptionSelectionChanged($event) {
        let option = $event.addedItems.pop() || $event.removedItems.pop() ||
            this.saveContextMenuItems[this.SAVE_OPTION_DEFAULT];
        option.selected = true;
        $event.component.option('selectedItem', option);

        this.updateSaveOption(option);
        this.save();
    }

    onFullNameKeyUp(title) {
        this.data.title = title;
        if (title) {
            let fullName = nameParser.parseFullName(title.trim());
            this.user.name = fullName.first;
            this.user.surname = fullName.last;
        } else {
            this.user.name = '';
            this.user.surname = '';
        }
    }

    getAssignedRoleCount(): number {
        return _.filter(this.roles, { isAssigned: true }).length;
    }

    getAssignedOrgUnitCount(): number {
        return this.organizationUnitTree.getSelectedOrganizations().length || 0;
    }

    setComponentToValid(component) {
        component.option('isValid', true);
    }

    focusInput(event) {
        if (!(event.component._value && event.component._value.trim())) {
            let input = event.event.originalEvent.target;
            setTimeout(function () {
                if (input.createTextRange) {
                    let part = input.createTextRange();
                    part.move('character', 0);
                    part.select();
                } else if (input.setSelectionRange)
                    input.setSelectionRange(0, 0);

                input.focus();
            }, 100);
        }
    }

    phoneComponentInitialized(event) {
        setTimeout(() => this.setComponentToValid(event.component), 500);
    }

    phoneComponentFocusOut(event) {
        let value = event.component.option("value");
        if (!value)
            this.setComponentToValid(event.component);
    }
}
