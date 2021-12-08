/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    EventEmitter,
    Output,
    ViewChild,
    OnInit,
    AfterViewInit,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import startCase from 'lodash/startCase';
import { MatDialog } from '@angular/material/dialog';
import { MatTabGroup } from '@angular/material/tabs';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope } from '@shared/AppEnums';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { GetCurrentUserProfileEditDto, CurrentUserProfileEditDto, SettingScopes, UserEmailSettings, EmailFromSettings, EmailSmtpSettings,
    SendTestEmailInput, ProfileServiceProxy, UpdateGoogleAuthenticatorKeyOutput } from '@shared/service-proxies/service-proxies';
import { SmsVerificationModalComponent } from './sms-verification-modal.component';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { SettingService } from '@abp/settings/setting.service';
import { MessageService } from '@abp/message/message.service';
import { EmailSmtpSettingsService } from '@shared/common/settings/email-smtp-settings.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { finalize } from '@node_modules/rxjs/internal/operators';

@Component({
    templateUrl: './my-settings-modal.component.html',
    styleUrls: [
        './my-settings-modal.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MySettingsModalComponent implements OnInit, AfterViewInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild('smsVerificationModal') smsVerificationModal: SmsVerificationModalComponent;
    @ViewChild(MatTabGroup) tabs: MatTabGroup;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    ckConfig: any = {
        enterMode: 3, /*CKEDITOR.ENTER_DIV*/
        height: innerHeight - 320 + 'px',
        pasteFilter: null,
        allowedContent: true,
        startupShowBorders: false,
        qtBorder: 0,
        stylesSet: [],
        contentsCss: [],
        toolbar: [
            { name: 'document', items: [ 'Source', '-', 'Preview'] },
            { name: 'clipboard', items: [ 'Cut', 'Copy', 'Paste', 'PasteText', '-', 'Undo', 'Redo' ] },
            { name: 'editing', items: [ 'Find', 'Replace', '-', 'SelectAll' ] },
            { name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike' ] },
            { name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote' ] },
            { name: 'links', items: [ 'Link', 'Unlink', 'Anchor' ] },
            '/',
            { name: 'insert', items: [ 'Image', 'Table', 'HorizontalRule', 'SpecialChar', 'PageBreak' ] },
            { name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize' ] },
            { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
            { name: 'tools', items: [ 'Maximize' ] },
        ],
        removePlugins: 'elementspath',
        extraPlugins: 'preview,colorbutton,font',
        skin: 'moono-lisa' //kama,moono-lisa
    };

    public tagsList = [];
    public tagsTooltipVisible = false;
    public userEmailSettings: UserEmailSettings = new UserEmailSettings({
        isUserSmtpEnabled: false,
        from: new EmailFromSettings(),
        smtp:  new EmailSmtpSettings(),
        signatureHtml: undefined
    });
    public isGoogleAuthenticatorEnabled = false;
    public isPhoneNumberConfirmed: boolean;
    public isPhoneNumberEmpty = false;
    public smsEnabled: boolean;
    public user: GetCurrentUserProfileEditDto;
    public showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    public canChangeUserName: boolean;
    public defaultTimezoneScope: SettingScopes = AppTimezoneScope.User;
    public currentTab = this.ls.l('Profile');
    public _initialUserSettings: any;
    public _initialEmailSettings: any;
    private _initialTimezone: string = undefined;
    private testEmailAddress: string = undefined;
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];
    constructor(
        private dialog: MatDialog,
        private profileService: ProfileServiceProxy,
        private appSessionService: AppSessionService,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private settingService: SettingService,
        private emailSmtpSettingsService: EmailSmtpSettingsService,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    ngAfterViewInit() {
        setTimeout(() => {
            let handleTabClick = this.tabs._handleClick;
            this.tabs._handleClick = (tab, header, index) => {
                this.checkTabSwitchAllowed().then((switchAllowed: boolean) => {
                    if (switchAllowed)
                        handleTabClick.apply(this.tabs, [tab, header, index]);
                });
            };
        }, 1000);
    }

    ngOnInit() {
        this.modalDialog.startLoading();
        this.profileService.getEmailSettings().subscribe((settings: UserEmailSettings) => {
            this.userEmailSettings = settings;
            this._initialEmailSettings = cloneDeep(settings);
            if (!this.userEmailSettings.isUserSmtpEnabled) {
                if (!this.userEmailSettings.from || !this.userEmailSettings.from.emailAddress || this.userEmailSettings.from.emailAddress.length == 0) {
                    this.userEmailSettings.from = new EmailFromSettings({
                        emailAddress: this.appSessionService.user.emailAddress,
                        displayName: this.appSessionService.user.name + ' ' + this.appSessionService.user.surname,
                    });
                }
                if (!this.userEmailSettings.smtp || !this.userEmailSettings.smtp.userName || this.userEmailSettings.smtp.userName.length == 0) {
                    this.userEmailSettings.smtp = new EmailSmtpSettings({
                        host: undefined,
                        port: undefined,
                        enableSsl: true,
                        domain: undefined,
                        userName: this.appSessionService.user.emailAddress,
                        password: undefined
                    });
                }
            }
            this.changeDetectorRef.detectChanges();
        });
        this.profileService.getCurrentUserProfileForEdit()
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result) => {
                this.smsEnabled = this.settingService.getBoolean('App.UserManagement.SmsVerificationEnabled');
                this.user = result;
                this._initialUserSettings = cloneDeep(result);
                this._initialTimezone = result.timezone;
                this.canChangeUserName = this.user.name !== AppConsts.userManagement.defaultAdminUserName;
                this.isGoogleAuthenticatorEnabled = result.isGoogleAuthenticatorEnabled;
                this.isPhoneNumberConfirmed = result.isPhoneNumberConfirmed;
                this.isPhoneNumberEmpty = result.phoneNumber === '';
                this.changeDetectorRef.detectChanges();
            });

        this.testEmailAddress = this.appSessionService.user.emailAddress;
    }

    updateQrCodeSetupImageUrl(): void {
        this.profileService.updateGoogleAuthenticatorKey().subscribe((result: UpdateGoogleAuthenticatorKeyOutput) => {
            this.user.qrCodeSetupImageUrl = result.qrCodeSetupImageUrl;
            this.isGoogleAuthenticatorEnabled = true;
            this.changeDetectorRef.detectChanges();
        });
    }

    smsVerify(): void {
        this.profileService.sendVerificationSms()
            .subscribe(() => {
                this.smsVerificationModal.show();
            });
    }

    changePhoneNumberToVerified(): void {
        this.isPhoneNumberConfirmed = true;
        this.changeDetectorRef.detectChanges();
    }

    onTagClick(event) {
        /*
            Will be added soon
        */
        this.tagsTooltipVisible = false;
    }

    save(): void {
        this.modalDialog.startLoading();
        (this.currentTab == this.ls.l('Email') ?
            this.profileService.updateEmailSettings(this.userEmailSettings) :
            this.profileService.updateCurrentUserProfile(CurrentUserProfileEditDto.fromJS(this.user))
        ).pipe(finalize(() => this.modalDialog.finishLoading())).subscribe(() => {
            this.appSessionService.user.name = this.user.name;
            this.appSessionService.user.surname = this.user.surname;
            this.appSessionService.user.userName = this.user.name;
            this.appSessionService.user.emailAddress = this.user.emailAddress;
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this._initialEmailSettings = cloneDeep(this.userEmailSettings);
            this._initialUserSettings = cloneDeep(this.user);
            this.modalSave.emit(null);
            if (abp.clock.provider.supportsMultipleTimezone && this._initialTimezone !== this.user.timezone) {
                this.messageService.info(this.ls.l('TimeZoneSettingChangedRefreshPageNotification')).done(() => {
                    window.location.reload();
                });
            }
        });
    }

    sendTestEmail(): void {
        this.modalDialog.startLoading();
        let input = new SendTestEmailInput();
        input.emailAddress = this.testEmailAddress;
        input.from = this.userEmailSettings.from;
        input.smtp = this.userEmailSettings.smtp;
        this.emailSmtpSettingsService.sendTestEmail(input,
            this.modalDialog.finishLoading.bind(this.modalDialog)
        );
    }

    isUserSettingsChanged(): boolean {
        return JSON.stringify(this._initialUserSettings) != JSON.stringify(this.user);
    }

    isEmailSettingsChanged(): boolean {
        return JSON.stringify(this.userEmailSettings) != JSON.stringify(this._initialEmailSettings);
    }

    checkTabSwitchAllowed(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.currentTab == this.ls.l('Email')) {
                if (this.isEmailSettingsChanged())
                    this.messageService.confirm(this.ls.l('UnsavedChanges'), isConfirmed => {
                        if (isConfirmed) {
                            this.userEmailSettings = cloneDeep(this._initialEmailSettings);
                            this.changeDetectorRef.detectChanges();
                        }
                        resolve(isConfirmed);
                    });
                else
                    resolve(true);
            } else if (this.currentTab == this.ls.l('Profile')) {
                if (this.isUserSettingsChanged())
                    this.messageService.confirm(this.ls.l('UnsavedChanges'), isConfirmed => {
                        if (isConfirmed) {
                            this.user = cloneDeep(this._initialUserSettings);
                            this.changeDetectorRef.detectChanges();
                        }
                        resolve(isConfirmed);
                    });
                else
                    resolve(true);
            } else
                resolve(true);
        });
    }

    onTabChanged(event) {
        this.currentTab = event.tab.textLabel;
        this.buttons[0].disabled = ![this.ls.l('Email'), this.ls.l('Profile')].includes(this.currentTab);
        this.changeDetectorRef.detectChanges();
    }

    checkCloseAllowed = () => {
        return new Promise((resolve, reject) => {
            if (this.isUserSettingsChanged() || this.isEmailSettingsChanged())
                this.messageService.confirm(this.ls.l('UnsavedChanges'), isConfirmed => {
                    resolve(isConfirmed);
                });
            else
                resolve(true);
        });
    }
}