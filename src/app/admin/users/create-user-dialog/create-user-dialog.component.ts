import { Component, OnInit, ViewChild, Injector, Output, EventEmitter, ElementRef, OnDestroy } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { UserServiceProxy, ProfileServiceProxy, UserEditDto, CreateOrUpdateUserInput, 
    OrganizationUnitDto, UserRoleDto, PasswordComplexitySetting, TenantHostType,
    ContactPhotoServiceProxy, CreateContactPhotoInput, ContactEmailServiceProxy,
    ContactPhoneServiceProxy } from '@shared/service-proxies/service-proxies';

import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { ContactTypes } from '@shared/AppEnums';
import { DxTextBoxComponent, DxContextMenuComponent, DxValidatorComponent, DxValidationSummaryComponent, DxButtonComponent } from 'devextreme-angular';
import { Router, ActivatedRoute } from '@angular/router';

import { MatDialog } from '@angular/material';
import { ModalDialogComponent } from 'shared/common/dialogs/modal/modal-dialog.component';
import { UploadPhotoDialogComponent } from '@app/shared/common/upload-photo-dialog/upload-photo-dialog.component';

import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';
import { NameParserService } from '@app/crm/shared/name-parser/name-parser.service';

import { OrganizationUnitsTreeComponent, IOrganizationUnitsTreeComponentData } from '../../shared/organization-unit-tree.component';

@Component({
    templateUrl: 'create-user-dialog.component.html',
    styleUrls: ['create-user-dialog.component.less'],
    providers: [ 
        ContactPhotoServiceProxy, ContactPhoneServiceProxy, 
        ContactEmailServiceProxy, NameParserService 
    ]
})
export class CreateUserDialogComponent extends ModalDialogComponent implements OnInit, OnDestroy {
    @ViewChild(DxContextMenuComponent) saveContextComponent: DxContextMenuComponent;
    @ViewChild('organizationUnitTree') organizationUnitTree: OrganizationUnitsTreeComponent;

    user = new UserEditDto();
    roles: UserRoleDto[];
    sendActivationEmail = true;
    setRandomPassword = true;
    passwordComplexityInfo = '';
    passwordComplexitySetting: any;
    canChangeUserName: boolean;

    emailsComponent: any;
    phonesComponent: any;

    private readonly SAVE_OPTION_DEFAULT   = 1;
    private readonly SAVE_OPTION_CACHE_KEY = 'save_option_active_index';
    
    saveButtonId: string = 'saveUserOptions';
    saveContextMenuItems = [];

    masks = AppConsts.masks;
    phoneRegEx = AppConsts.regexPatterns.phone;
    emailRegEx = AppConsts.regexPatterns.email;
    urlRegEx = AppConsts.regexPatterns.url;

    company: string;
    title: string;
    website: string;
    notes = {};

    emailValidators: any = [];
    phoneValidators: any = [];
    websiteValidators: any = [];

    emails = {};
    emailTypePersonalDefault = 'P';
    emailTypeBusinessDefault = 'W';
    emailType = this.emailTypePersonalDefault;

    phones = {};
    phoneTypePersonalDefault = 'M';
    phoneTypeBusinessDefault = 'W';
    phoneType = this.phoneTypePersonalDefault;

    phoneExtension = {};
    phoneTypes: any = [];
    emailTypes: any = [];
    states: any;
    countries: any;

    photoOriginalData: string;
    photoThumbnailData: string;
    profilePicture: string;

    addButtonVisible = {};
    clearButtonVisible = {}

    contacts: any = {
        emails: [],
        phones: []
    };

    toolbarConfig = [];

    allOrganizationUnits: OrganizationUnitDto[];
    memberedOrganizationUnits: string[];

    private namePattern = AppConsts.regexPatterns.name;
    private validationError: string;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _userService: UserServiceProxy,
        private _profileService: ProfileServiceProxy,
        private _cacheService: CacheService,
        private _photoUploadService: ContactPhotoServiceProxy,
        private _contactPhoneService: ContactPhoneServiceProxy,
        private _contactEmailService: ContactEmailServiceProxy,
        private _router: Router,
        private _nameParser: NameParserService
    ) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CRMLocalizationSourceName;
        this._cacheService = this._cacheService.useStorage(0);

        this.saveContextMenuItems = [
            {text: this.l('SaveAndAddNew'), selected: false}, 
            {text: this.l('SaveAndClose'), selected: false}
        ];

        this.userDataInit();
        this.phoneTypesLoad();
        this.emailTypesLoad();
        this.initToolbarConfig();
    }

    userDataInit() {
        this.setRandomPassword = true;
        this.sendActivationEmail = true;

        this._userService.getUserForEdit(undefined).subscribe(userResult => {
            this.user = userResult.user;
            this.roles = userResult.roles;
            this.canChangeUserName = this.user.userName !== AppConsts.userManagement.defaultAdminUserName;

            //this.allOrganizationUnits = userResult.allOrganizationUnits;
            //this.memberedOrganizationUnits = userResult.memberedOrganizationUnits;

            this.organizationUnitTree.data = <IOrganizationUnitsTreeComponentData>{
                allOrganizationUnits : userResult.allOrganizationUnits,
                selectedOrganizationUnits: userResult.memberedOrganizationUnits
            };

            this.getProfilePicture(userResult.profilePictureId);

            this._profileService.getPasswordComplexitySetting().subscribe(passwordComplexityResult => {
                this.passwordComplexitySetting = passwordComplexityResult.setting;
                this.setPasswordComplexityInfo();
            });
        });
    }

    getProfilePicture(profilePictureId: string): void {
        if (!profilePictureId) {
            this.profilePicture = '/assets/common/images/default-profile-picture.png';
        } else {
            this._profileService.getProfilePictureById(profilePictureId).subscribe(result => {
                if (result && result.profilePicture) {
                    this.profilePicture = 'data:image/jpeg;base64,' + result.profilePicture;
                } else {
                    this.profilePicture = '/assets/common/images/default-profile-picture.png';
                }
            });
        }
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

    private createEntity(): void {        
        let saveButton: any = document.getElementById(this.saveButtonId);
        saveButton.disabled = true;
    }

    private afterSave(customerId: number, leadId?: number): void
    {
        if (this.saveContextMenuItems[0].selected) {
            this.resetFullDialog();
            this.notify.info(this.l('SavedSuccessfully'));
        } else if (this.saveContextMenuItems[1].selected) {
            return this.data.refreshParent(true);
        } else 
            this.close();
        this.data.refreshParent();
    }

    save(event?): void {     
        if (event && event.offsetX > 195)
            return this.saveContextComponent
                .instance.option('visible', true);

/*
        if (!this.user.firstName || !this.user.lastName) {
            this.data.isTitleValid = false;
            return this.notify.error(this.l('FullNameIsRequired'));
        }
*/
        if (!this.validateMultiple(this.emailValidators) ||
            !this.validateMultiple(this.phoneValidators)
        )
            return ;

        this.checkAddContactByField('emails');
        this.checkAddContactByField('phones');

        if (!this.validateBusinessTab())
            return ;
    
        this.createEntity();
    }

    private validateMultiple(validators): boolean{
        let result = true;
        validators.forEach((v) => { result = result && v.validate().isValid; });
        return result;
    }

    validateBusinessTab() {
        if ((this.contacts.emails.business.length 
            || this.contacts.phones.business.length 
          ) && !this.company
        )
            return this.notify.error(this.l('CompanyNameIsRequired'));

        return this.validateMultiple(this.websiteValidators);
    }

    checkAddContactByField(field) {
        _.mapObject(this.addButtonVisible, 
            (obj) => {
              obj[field] && this.addContact(field);
            }
        );
    }

    getBase64(data) {
        let prefix = ';base64,';
        return data && data.slice(data.indexOf(prefix) + prefix.length);
    }

    getDialogPossition(event, shiftX) {
        return this.calculateDialogPosition(event, event.target.closest('div'), shiftX, -12);
    }

    getInputElementValue(event) {
        return event.element.getElementsByTagName('input')[0].value;
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

    blurInput(event) {
        if (!(event.component._value && event.component._value.trim()))
            event.component.option({ mask: '', value: '', isValid: true });
    }

    setDefaultTypeValue(obj, list, field = null) {
        if (list.length)
            if (field)
                obj[field] = obj[field] || list[0].id;
            else
                obj = obj || list[0].id;
    }

    phoneTypesLoad() {
        this._contactPhoneService.getPhoneUsageTypes().subscribe(result => {
            this.phoneTypes = result.items;
            this.setDefaultTypeValue(this.phoneType, result.items);
        });
    }

    emailTypesLoad() {
        this._contactEmailService.getEmailUsageTypes().subscribe(result => {
            this.emailTypes = result.items;
            this.setDefaultTypeValue(this.emailType, result.items);
        });
    }

    addContact(field) {
        let value = this.getValidateFieldValue(field);
        if (value && this.contacts[field].every((val) => {
            return JSON.stringify(value) != JSON.stringify(val);
        }))
            this.contacts[field].push(value);
    }

    removeContact(field, index) {
        this.contacts[field].splice(index, 1);
    }

    getValidateFieldValue(field) {
        let value;
        if (field == 'emails')
            value = {
                type: this.emailType,
                email: this.emails
            };
        else if (field == 'phones') {
            value = { 
                type: this.phoneType,
                number: this.phones,
                ext: this.phoneExtension
            };
            this.phoneExtension = undefined;
        }

        this.resetComponent(this[field + 'Component']);        
        this.addButtonVisible[field] = false;

        return value;
    }

    resetComponent(component) {
        component.reset();
        component.option('isValid', true);
    }

    validateEmailAddress(value): boolean {
        return this.emailRegEx.test(value);
    }

    validatePhoneNumber(value): boolean {
        return this.phoneRegEx.test(value);
    }

    onTypeChanged($event, field) {
        $event.element.parentNode.classList
            .replace(this[field + 'Type'], $event.value);
        this[field + 'Type'] = $event.value;
    }

    initValidationGroup($event, validator) {
        this[validator].push($event.component);
    }

    onKeyUp($event, field, data) {
        let value = this.getInputElementValue($event);
        this.addButtonVisible[field] = field == 'emails' ?
            this.validateEmailAddress(value): this.validatePhoneNumber(value);

        data = value;
       
        this.clearButtonVisible[field] = value 
            && !this.addButtonVisible[field];
    }

    onCompanyKeyUp($event) {
        this.company = this.getInputElementValue($event);
    }

    onCommentKeyUp($event) {
        this.notes = $event.element.getElementsByTagName('textarea')[0].value;
    }

    setComponentToValid(field, reset = false) {
        let component = this[field];
        reset && component.reset();
        setTimeout(() => component.option('isValid', true));
    }

    showUploadPhoto($event) {
        this.dialog.open(UploadPhotoDialogComponent, {
            data: {
                source: this.photoOriginalData
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

    onComponentInitialized($event, field) {
        this[field + 'Component'] = $event.component;
        $event.component.option('value', this[field]);
    }

    emptyInput(field) {
        this.setComponentToValid(field, true);
        this.clearButtonVisible[field] = false;
    }

    resetFullDialog() {
        this.resetComponent(this['emailsComponent']);
        this.resetComponent(this['phonesComponent']);
        this.clearButtonVisible['emails'] = false;
        this.clearButtonVisible['phones'] = false;
        this.addButtonVisible['emails'] = false;
        this.addButtonVisible['phones'] = false;
        this.contacts.emails = [];
        this.contacts.phones = [];
        this.emails = [];
        this.phones = [];
        this.phoneExtension = undefined;

        this.user = new UserEditDto();
    }

    onSaveOptionSelectionChanged($event) {
        let option = $event.addedItems.pop() || $event.removedItems.pop() ||
            this.saveContextMenuItems[this.SAVE_OPTION_DEFAULT];
        option.selected = true;
        $event.component.option('selectedItem', option);

        this.updateSaveOption(option);
        this.save();
    }

    onFullNameKeyUp(event) {
        this.data.title = event;
        //this._nameParser.parseIntoPerson(this.data.title, this.user);
    }

    getAssignedRoleCount(): number {
        return _.filter(this.roles, { isAssigned: true }).length;
    }

    ngOnDestroy(): void {
    }
}