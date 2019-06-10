/** Core imports */
import { Component, ChangeDetectionStrategy, OnInit, ViewChild, Inject, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DxContextMenuComponent } from 'devextreme-angular/ui/context-menu';
import { DxTextBoxComponent } from 'devextreme-angular/ui/text-box';
import { CacheService } from 'ng2-cache-service';
import * as nameParser from 'parse-full-name';
import { finalize, tap, switchMap } from 'rxjs/operators';
import * as _ from 'underscore';

/** Application imports */
import {
    UserServiceProxy, ProfileServiceProxy, UserEditDto, CreateOrUpdateUserInput,
    UserRoleDto, PasswordComplexitySetting, GetPasswordComplexitySettingOutput
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { StringHelper } from '@shared/helpers/StringHelper';
import { OrganizationUnitsTreeComponent, IOrganizationUnitsTreeComponentData } from '../../shared/organization-unit-tree.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { MessageService } from '@abp/message/message.service';
import { SettingService } from '@abp/settings/setting.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    templateUrl: 'create-user-dialog.component.html',
    styleUrls: [ '../../../shared/_checkbox-radio.less', 'create-user-dialog.component.less' ],
    providers: [ CacheHelper, DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateUserDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;
    @ViewChild('organizationUnitTree') organizationUnitTree: OrganizationUnitsTreeComponent;
    @ViewChild('phoneNumber') phoneNumber: DxTextBoxComponent;

    user = new UserEditDto();
    roles: UserRoleDto[];
    initialRoles: UserRoleDto[];
    sendActivationEmail = true;
    setRandomPassword = false;
    passwordComplexityInfo = '';

    isTwoFactorEnabled: boolean = this._settingService.getBoolean('Abp.Zero.UserManagement.TwoFactorLogin.IsEnabled');
    isLockoutEnabled: boolean = this._settingService.getBoolean('Abp.Zero.UserManagement.UserLockOut.IsEnabled');
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();

    private orgUnits: any = [];

    private readonly SAVE_OPTION_DEFAULT = 1;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';

    saveButtonId = 'saveUserOptions';
    saveContextMenuItems = [];

    masks = AppConsts.masks;
    phoneRegEx = AppConsts.regexPatterns.phone;
    emailRegEx = AppConsts.regexPatterns.email;

    photoOriginalData: string;
    photoThumbnailData: string;
    photoSourceData: string;
    toolbarConfig = [];
    title: string = '';
    buttons: IDialogButton[] = [
        {
            id: this.saveButtonId,
            title: this.ls.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private _userService: UserServiceProxy,
        private _profileService: ProfileServiceProxy,
        private _cacheService: CacheService,
        private _notifyService: NotifyService,
        private _dialogService: DialogService,
        private _dialogRef: MatDialogRef<CreateUserDialogComponent>,
        private _messageService: MessageService,
        private _settingService: SettingService,
        private _cacheHelper: CacheHelper,
        private _changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        public dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {
        this.saveContextMenuItems = [
            { text: this.ls.l('SaveAndAddNew'), selected: false },
            { text: this.ls.l('SaveAndClose'), selected: false }
        ];
    }

    ngOnInit() {
        this.userDataInit();
        this.initToolbarConfig();
        this.saveOptionsInit();
    }

    userDataInit() {
        this.modalDialog.startLoading();
        this._userService.getUserForEdit(undefined)
            .pipe(
                tap(userResult => {
                    this.user = userResult.user;
                    this.roles = userResult.roles;
                    this.initialRoles = this.roles.map((role) => {
                        return _.clone(role);
                    });

                    this.orgUnits = userResult.allOrganizationUnits;
                    this.organizationUnitTree.data = <IOrganizationUnitsTreeComponentData>{
                        allOrganizationUnits: userResult.allOrganizationUnits,
                        selectedOrganizationUnits: userResult.memberedOrganizationUnits
                    };
                    this._changeDetectorRef.detectChanges();
                }),
                switchMap(() => this._profileService.getPasswordComplexitySetting()),
                finalize(() => {
                    this.modalDialog.finishLoading();
                    this._changeDetectorRef.detectChanges();
                })
            ).subscribe((passwordComplexityResult: GetPasswordComplexitySettingOutput) => {
                this.passwordComplexitySetting = passwordComplexityResult.setting;
                this.setPasswordComplexityInfo();
            });
    }

    setPasswordComplexityInfo(): void {

        this.passwordComplexityInfo = '<ul>';

        if (this.passwordComplexitySetting.requireDigit) {
            this.passwordComplexityInfo += '<li>' + this.ls.l('PasswordComplexity_RequireDigit_Hint') + '</li>';
        }

        if (this.passwordComplexitySetting.requireLowercase) {
            this.passwordComplexityInfo += '<li>' + this.ls.l('PasswordComplexity_RequireLowercase_Hint') + '</li>';
        }

        if (this.passwordComplexitySetting.requireUppercase) {
            this.passwordComplexityInfo += '<li>' + this.ls.l('PasswordComplexity_RequireUppercase_Hint') + '</li>';
        }

        if (this.passwordComplexitySetting.requireNonAlphanumeric) {
            this.passwordComplexityInfo += '<li>' + this.ls.l('PasswordComplexity_RequireNonAlphanumeric_Hint') + '</li>';
        }

        if (this.passwordComplexitySetting.requiredLength) {
            this.passwordComplexityInfo += '<li>' + this.ls.l('PasswordComplexity_RequiredLength_Hint', this.passwordComplexitySetting.requiredLength.toString()) + '</li>';
        }

        this.passwordComplexityInfo += '</ul>';
    }

    initToolbarConfig() {
        this.toolbarConfig = [
            {
                location: 'after', items: [
                    {
                        name: 'discard',
                        action: this.resetFullDialog.bind(this, false)
                    }
                ]
            }
        ];
        this._changeDetectorRef.detectChanges();
    }

    saveOptionsInit() {
        let cacheKey = this._cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            selectedIndex = this.SAVE_OPTION_DEFAULT;
        if (this._cacheService.exists(cacheKey))
            selectedIndex = this._cacheService.get(cacheKey);
        this.saveContextMenuItems[selectedIndex].selected = true;
        this.buttons[0].title = this.saveContextMenuItems[selectedIndex].text;
    }

    updateSaveOption(option) {
        this.buttons[0].title = option.text;
        this._cacheService.set(this._cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            this.saveContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
    }

    private afterSave(userId): void {
        if (this.saveContextMenuItems[0].selected) {
            this.resetFullDialog();
            this._notifyService.info(this.ls.l('SavedSuccessfully'));
            this.data.refreshParent(true);
        } else {
            this.data.refreshParent();
            this.close(true);
        }
    }

    private close(refresh = false) {
        this._dialogRef.close(refresh);
    }

    validateForm() {
        if (!this.user.name || !this.user.surname)
            return this._notifyService.error(this.ls.l('FullNameIsRequired'));

        if (this.user.emailAddress) {
            if (!this.validateEmailAddress(this.user.emailAddress))
                return this._notifyService.error(this.ls.l('EmailIsNotValid'));
        } else
            return this._notifyService.error(this.ls.l('EmailIsRequired'));

        if (!this.validatePhoneNumber(this.user.phoneNumber))
            return this._notifyService.error(this.ls.l('PhoneValidationError'));

        return true;
    }

    save(event?): void {
        if (event && event.offsetX > 195)
            return this.saveContextComponent.instance.option('visible', true);

        if (!this.validateForm())
            return;

        this.modalDialog.startLoading();
        let saveButton: any = document.getElementById(this.saveButtonId);
        saveButton.disabled = true;

        let input = new CreateOrUpdateUserInput();

        input.user = this.user;
        input.user.userName = this.user.emailAddress;
        input.setRandomPassword = this.setRandomPassword;
        input.sendActivationEmail = this.sendActivationEmail;
        input.assignedRoleNames = _.map(
            _.filter(this.roles, { isAssigned: true }), role => role.roleName
        );

        input.organizationUnits = this.organizationUnitTree.getSelectedOrganizations();
        input.profilePicture = StringHelper.getBase64(this.photoOriginalData);
        input.profileThumbnail = StringHelper.getBase64(this.photoThumbnailData);
        input.pictureSource = this.photoSourceData;

        this._userService.createOrUpdateUser(input)
            .pipe(finalize(() => {
                saveButton.disabled = false;
                this.modalDialog.finishLoading();
                this._changeDetectorRef.detectChanges();
            }))
            .subscribe((userId) => this.afterSave(userId || this.user.id));
    }

    validateEmailAddress(value): boolean {
        return this.emailRegEx.test(value);
    }

    validatePhoneNumber(value): boolean {
        return !value || this.phoneRegEx.test(value);
    }

    showUploadPhoto($event) {
        this.dialog.open(UploadPhotoDialogComponent, {
            data: {
                source: this.photoOriginalData,
                maxSizeBytes: AppConsts.maxImageSize
            },
            hasBackdrop: true
        }).afterClosed().subscribe((result) => {
            if (result) {
                this.photoOriginalData = result.origImage;
                this.photoThumbnailData = result.thumImage;
                this.photoSourceData = result.source;
                this._changeDetectorRef.detectChanges();
            }
        });
        $event.stopPropagation();
    }

    resetFullDialog(forced = true) {
        let resetInternal = () => {
            this.title = '';
            this.setRandomPassword = false;
            this.sendActivationEmail = true;
            this.user = new UserEditDto();
            this.photoOriginalData = undefined;
            this.photoThumbnailData = undefined;
            this.photoSourceData = undefined;
            this.roles.forEach((role, index) => {
                role.isAssigned = this.initialRoles[index].isAssigned;
            });

            if (this.orgUnits.length)
                this.organizationUnitTree.data = <IOrganizationUnitsTreeComponentData>{
                    allOrganizationUnits: this.orgUnits,
                    selectedOrganizationUnits: [this.orgUnits[0].code]
                };

            setTimeout(() => {
                this.setComponentToValid(this.phoneNumber.instance);
                this._changeDetectorRef.detectChanges();
            });
        };

        if (forced)
            resetInternal();
        else
            this._messageService.confirm(this.ls.l('DiscardConfirmation'), '', (confirmed) => {
                if (confirmed)
                    resetInternal();
            });
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
        if (title) {
            let fullName = nameParser.parseFullName(title.trim());
            this.user.name = fullName.first;
            this.user.surname = fullName.last;
        } else {
            this.user.name = '';
            this.user.surname = '';
        }
        this._changeDetectorRef.detectChanges();
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
        let value = event.component.option('value');
        if (!value)
            this.setComponentToValid(event.component);
    }
}
