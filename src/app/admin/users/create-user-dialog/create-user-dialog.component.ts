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
    UserServiceProxy,
    ProfileServiceProxy,
    UserEditDto,
    CreateOrUpdateUserInput,
    UserRoleDto,
    PasswordComplexitySetting,
    GetPasswordComplexitySettingOutput,
    GetUserForEditOutput,
    OrganizationUnitDto
} from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';
import { StringHelper } from '@shared/helpers/StringHelper';
import { IOrganizationUnitsTreeComponentData } from '../../shared/organization-units-tree/organization-units-tree.component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { MessageService } from '@abp/message/message.service';
import { SettingService } from '@abp/settings/setting.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ToolbarService } from '@app/shared/common/toolbar/toolbar.service';

@Component({
    templateUrl: 'create-user-dialog.component.html',
    styleUrls: [
        '../../../shared/common/styles/checkbox-radio.less',
        '../../../shared/common/toolbar/toolbar.component.less',
        '../../../shared/common/styles/form.less',
        'create-user-dialog.component.less'
    ],
    providers: [ CacheHelper, DialogService, ToolbarService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateUserDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild(DxContextMenuComponent, { static: true }) saveContextComponent: DxContextMenuComponent;
    @ViewChild('phoneNumber', { static: true }) phoneNumber: DxTextBoxComponent;

    user = new UserEditDto();
    roles: UserRoleDto[];
    organizationUnits;
    selectedOrganizationsIds: number[];
    rolesTooltipVisible = false;
    organizationUnitsTooltipVisible = false;
    initialRoles: UserRoleDto[];
    sendActivationEmail = true;
    setRandomPassword = false;
    passwordComplexityInfo = '';

    isTwoFactorEnabled: boolean = this.settingService.getBoolean('Abp.Zero.UserManagement.TwoFactorLogin.IsEnabled');
    isLockoutEnabled: boolean = this.settingService.getBoolean('Abp.Zero.UserManagement.UserLockOut.IsEnabled');
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
    title = '';
    buttons: IDialogButton[] = [
        {
            id: this.saveButtonId,
            title: this.ls.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private userService: UserServiceProxy,
        private profileService: ProfileServiceProxy,
        private cacheService: CacheService,
        private notifyService: NotifyService,
        private dialogService: DialogService,
        private dialogRef: MatDialogRef<CreateUserDialogComponent>,
        private messageService: MessageService,
        private settingService: SettingService,
        private cacheHelper: CacheHelper,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService,
        public dialog: MatDialog,
        public toolbarService: ToolbarService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {
        this.saveContextMenuItems = [
            { text: this.ls.l('SaveAndAddNew'), selected: false },
            { text: this.ls.l('SaveAndClose'), selected: false }
        ];
    }

    ngOnInit() {
        this.userDataInit();
        this.saveOptionsInit();
    }

    userDataInit() {
        this.modalDialog.startLoading();
        this.userService.getUserForEdit(undefined)
            .pipe(
                tap((userResult: GetUserForEditOutput) => {
                    this.user = userResult.user;
                    this.roles = userResult.roles;
                    this.initialRoles = this.roles.map((role) => {
                        return _.clone(role);
                    });

                    this.orgUnits = userResult.allOrganizationUnits;
                    this.selectedOrganizationsIds = userResult.allOrganizationUnits
                        .filter((organizationUnit: OrganizationUnitDto) => {
                            return userResult.memberedOrganizationUnits.indexOf(organizationUnit.code) >= 0;
                        })
                        .map((organizationUnit: OrganizationUnitDto) => organizationUnit.id);
                    this.organizationUnits = <IOrganizationUnitsTreeComponentData>{
                        allOrganizationUnits: userResult.allOrganizationUnits,
                        selectedOrganizationUnits: userResult.memberedOrganizationUnits
                    };
                    this.changeDetectorRef.detectChanges();
                }),
                switchMap(() => this.profileService.getPasswordComplexitySetting()),
                finalize(() => {
                    this.modalDialog.finishLoading();
                    this.changeDetectorRef.detectChanges();
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

    saveOptionsInit() {
        let cacheKey = this.cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            selectedIndex = this.SAVE_OPTION_DEFAULT;
        if (this.cacheService.exists(cacheKey))
            selectedIndex = this.cacheService.get(cacheKey);
        this.saveContextMenuItems[selectedIndex].selected = true;
        this.buttons[0].title = this.saveContextMenuItems[selectedIndex].text;
    }

    updateSaveOption(option) {
        this.buttons[0].title = option.text;
        this.cacheService.set(this.cacheHelper.getCacheKey(this.SAVE_OPTION_CACHE_KEY, this.constructor.name),
            this.saveContextMenuItems.findIndex((elm) => elm.text == option.text).toString());
    }

    private afterSave(): void {
        if (this.saveContextMenuItems[0].selected) {
            this.resetFullDialog();
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.data.refreshParent(true);
        } else {
            this.data.refreshParent();
            this.close(true);
        }
    }

    private close(refresh = false) {
        this.dialogRef.close(refresh);
    }

    validateForm() {
        if (!this.user.name || !this.user.surname)
            return this.notifyService.error(this.ls.l('FullNameIsRequired'));

        if (this.user.emailAddress) {
            if (!this.validateEmailAddress(this.user.emailAddress))
                return this.notifyService.error(this.ls.l('EmailIsNotValid'));
        } else
            return this.notifyService.error(this.ls.l('EmailIsRequired'));

        if (!this.validatePhoneNumber(this.user.phoneNumber))
            return this.notifyService.error(this.ls.l('PhoneValidationError'));

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
        input.assignedRoleNames = this.roles.filter((role: UserRoleDto) => role.isAssigned)
                                            .map((role: UserRoleDto) => role.roleName);

        input.organizationUnits = this.selectedOrganizationsIds;
        input.profilePicture = StringHelper.getBase64(this.photoOriginalData);
        input.profileThumbnail = StringHelper.getBase64(this.photoThumbnailData);
        input.pictureSource = this.photoSourceData;

        this.userService.createOrUpdateUser(input)
            .pipe(finalize(() => {
                saveButton.disabled = false;
                this.modalDialog.finishLoading();
                this.changeDetectorRef.detectChanges();
            }))
            .subscribe(() => this.afterSave());
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
                this.changeDetectorRef.detectChanges();
            }
        });
        $event.stopPropagation();
    }

    resetFullDialog(forced = true) {
        let resetInternal = () => {
            this.title = '';
            this.modalDialog.clear();
            this.setRandomPassword = false;
            this.sendActivationEmail = true;
            this.user = new UserEditDto();
            this.user.shouldChangePasswordOnNextLogin = true;
            this.user.isActive = true;
            this.user.isLockoutEnabled = true;
            this.photoOriginalData = undefined;
            this.photoThumbnailData = undefined;
            this.photoSourceData = undefined;
            this.roles.forEach((role, index) => {
                role.isAssigned = this.initialRoles[index].isAssigned;
            });

            if (this.orgUnits.length) {
                this.organizationUnits = <IOrganizationUnitsTreeComponentData>{
                    allOrganizationUnits: this.orgUnits,
                    selectedOrganizationUnits: [ this.orgUnits[0].code ]
                };
                this.selectedOrganizationsIds = [ this.orgUnits[0].id ];
            }

            setTimeout(() => this.setComponentToValid(this.phoneNumber.instance), 800);
            setTimeout(() => this.changeDetectorRef.detectChanges());
        };

        if (forced)
            resetInternal();
        else
            this.messageService.confirm(this.ls.l('DiscardConfirmation'), '', (confirmed) => {
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
        this.changeDetectorRef.detectChanges();
    }

    getAssignedRoleCount(): number {
        return this.roles && this.roles.filter((role: UserRoleDto) => role.isAssigned).length;
    }

    getAssignedOrgUnitCount(): number {
        return this.selectedOrganizationsIds && this.selectedOrganizationsIds.length;
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
        setTimeout(() => this.setComponentToValid(event.component), 800);
    }

    phoneComponentFocusOut(event) {
        let value = event.component.option('value');
        if (!value)
            this.setComponentToValid(event.component);
    }

    toggleUserRolesDropdown() {
        this.rolesTooltipVisible = !this.rolesTooltipVisible;
    }

    toggleOrganizationUnitsDropdown() {
        this.organizationUnitsTooltipVisible = !this.organizationUnitsTooltipVisible;
    }

    selectedOrgUnitsChanged(selectedOrgUnitsIds: number[]) {
        this.selectedOrganizationsIds = selectedOrgUnitsIds;
    }
}
