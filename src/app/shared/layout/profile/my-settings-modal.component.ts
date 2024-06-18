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
import { finalize, tap } from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope } from '@shared/AppEnums';
import { AppSessionService } from '@shared/common/session/app-session.service';
import {
    GetCurrentUserProfileEditDto, CurrentUserProfileEditDto, SettingScopes, UserEmailSettings, EmailFromSettings, EmailSmtpSettings,
    SendSMTPTestEmailInput, ProfileServiceProxy, GoogleServiceProxy, GmailSettingsDto, GmailSettingsEditDto, UpdateSignatureDto
} from '@shared/service-proxies/service-proxies';
import { SmsVerificationModalComponent } from './sms-verification-modal.component';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { SettingService } from 'abp-ng2-module';
import { MessageService } from 'abp-ng2-module';
import { EmailSmtpSettingsService } from '@shared/common/settings/email-smtp-settings.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { GmailSettingsService } from '@shared/common/settings/gmail-settings.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    templateUrl: './my-settings-modal.component.html',
    styleUrls: [
        './my-settings-modal.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GoogleServiceProxy, GmailSettingsService]
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
            { name: 'document', items: ['Source', '-', 'Preview'] },
            { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'PasteText', '-', 'Undo', 'Redo'] },
            { name: 'editing', items: ['Find', 'Replace', '-', 'SelectAll'] },
            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike'] },
            { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote'] },
            { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
            '/',
            { name: 'insert', items: ['Image', 'Table', 'HorizontalRule', 'SpecialChar', 'PageBreak'] },
            { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
            { name: 'colors', items: ['TextColor', 'BGColor'] },
            { name: 'tools', items: ['Maximize'] },
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
        smtp: new EmailSmtpSettings(),
        imapHost: undefined,
        imapPort: undefined,
        isImapEnabled: false,
        imapUseSsl: false
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
    public _initialGmailSettings: GmailSettingsDto;
    public _initialSignatureHtml: string;
    private _initialTimezone: string = undefined;
    private testEmailAddress: string = undefined;
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    gmailSettings: GmailSettingsDto = new GmailSettingsDto();
    signatureHtml: string;
    
    smtpProviderErrorLink: string;
    supportedProviders: any = [
        ...this.emailSmtpSettingsService.supportedProviders,
        {
            name: 'Other Mail Provdier', 
            host: '', 
            port: '', 
            ssl: false, 
            domain: '', 
            icon: 'email.svg',
            imap: {host: '', port: '', ssl: false}
        }
    ];
    selectedProvider: any;

    constructor(
        private dialog: MatDialog,
        private profileService: ProfileServiceProxy,
        private appSessionService: AppSessionService,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private settingService: SettingService,
        private emailSmtpSettingsService: EmailSmtpSettingsService,
        private changeDetectorRef: ChangeDetectorRef,
        private googleService: GoogleServiceProxy,
        private gmailSettingsService: GmailSettingsService,
        public ls: AppLocalizationService
    ) { }

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

            if (settings && settings.smtp.host)
                this.selectedProvider = this.supportedProviders.find(item => item.host == settings.smtp.host);
            
            if (!this.selectedProvider)
                this.selectedProvider = this.supportedProviders[this.supportedProviders.length - 1];

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
            this._initialEmailSettings = cloneDeep(this.userEmailSettings);
            this.changeDetectorRef.detectChanges();
        });
        this.profileService.getCurrentUserProfileForEdit()
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result) => {
                this.smsEnabled = this.settingService.getBoolean('App.UserManagement.SmsVerificationEnabled');
                this.user = result;
                this.canChangeUserName = this.user.name !== AppConsts.userManagement.defaultAdminUserName;
                this.isGoogleAuthenticatorEnabled = result.isGoogleAuthenticatorEnabled;
                this.isPhoneNumberConfirmed = result.isPhoneNumberConfirmed;
                this.isPhoneNumberEmpty = result.phoneNumber === '';
                setTimeout(() => {
                    this._initialUserSettings = cloneDeep(this.user);
                    this._initialTimezone = this.user.timezone;
                }, 600);
                this.changeDetectorRef.detectChanges();
            });
        this.gmailSettingsService.initGmail(() => this.initGmailClient());
        this.profileService.getSignatureHtml()
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result) => {
                this.signatureHtml = result;
                this._initialSignatureHtml = result;
            });

        this.testEmailAddress = this.appSessionService.user.emailAddress;
    }

    onProviderChanged() {
        if (this.selectedProvider.host) {
            this.userEmailSettings.smtp.host = this.selectedProvider.host;
            this.userEmailSettings.smtp.port = this.selectedProvider.port;
            this.userEmailSettings.smtp.enableSsl = this.selectedProvider.ssl;
            this.userEmailSettings.smtp.domain = this.selectedProvider.domain;
            this.userEmailSettings.imapHost = this.selectedProvider.imap.host;
            this.userEmailSettings.imapPort = this.selectedProvider.imap.port;
            this.userEmailSettings.imapUseSsl = this.selectedProvider.imap.ssl;
            this.userEmailSettings.isImapEnabled = !!this.selectedProvider.imap.host;
        } else {
            this.userEmailSettings.smtp.host = undefined;
            this.userEmailSettings.smtp.port = undefined;
            this.userEmailSettings.smtp.enableSsl = undefined;
            this.userEmailSettings.smtp.domain = undefined;
            this.userEmailSettings.imapHost = undefined;
            this.userEmailSettings.imapPort = undefined;
            this.userEmailSettings.imapUseSsl = undefined;
            this.userEmailSettings.isImapEnabled = false;
        }

        this.changeDetectorRef.detectChanges();
    }

    onSmtpStateChange(event) {
        if (event.value) {
            if (!this.selectedProvider)
                this.selectedProvider = this.supportedProviders[0];

            this.onProviderChanged();
        }
    }

    updateQrCodeSetupImageUrl(): void {
        //this.profileService.updateGoogleAuthenticatorKey().subscribe((result: UpdateGoogleAuthenticatorKeyOutput) => {
        //    this.user.qrCodeSetupImageUrl = result.qrCodeSetupImageUrl;
        //    this.isGoogleAuthenticatorEnabled = true;
        //    this.changeDetectorRef.detectChanges();
        //});
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
        let saveObs: Observable<void>;
        if (this.currentTab == this.ls.l('SMTP')) {
            if (!this.userEmailSettings.isImapEnabled) {
                this.userEmailSettings.imapHost = undefined;
                this.userEmailSettings.imapPort = undefined;
                this.userEmailSettings.imapUseSsl = undefined;
            }

            saveObs = this.profileService.updateEmailSettings(this.userEmailSettings).pipe(tap(() => {
                sessionStorage.removeItem('SupportedFrom' + this.appSessionService.userId);
            }));
        }
        else if (this.currentTab == this.ls.l('Profile')) {
            saveObs = this.profileService.updateCurrentUserProfile(CurrentUserProfileEditDto.fromJS(this.user));
        }
        else if (this.currentTab == this.ls.l('Gmail')) {
            let obj = new GmailSettingsEditDto();
            obj.init(this.gmailSettings);
            obj.forUser = true;
            saveObs = this.googleService.updateGmailSettings(obj).pipe(tap(() => {
                sessionStorage.removeItem('SupportedFrom' + this.appSessionService.userId);
            }));
        }
        else if (this.currentTab == this.ls.l('Signature')) {
            saveObs = this.profileService.updateSignatureHtml(new UpdateSignatureDto({ signatureHtml: this.signatureHtml }));
        }
        else {
            return;
        }

        saveObs
            .pipe(
                finalize(() => this.modalDialog.finishLoading()),
                catchError(error => {
                    this.checkHandlerErrorWarning(true);
                    return throwError(error);
                })
            )
            .subscribe(() => {
                this.appSessionService.user.name = this.user.name;
                this.appSessionService.user.surname = this.user.surname;
                this.appSessionService.user.userName = this.user.name;
                this.appSessionService.user.emailAddress = this.user.emailAddress;
                this.notifyService.info(this.ls.l('SavedSuccessfully'));
                this._initialEmailSettings = cloneDeep(this.userEmailSettings);
                this._initialUserSettings = cloneDeep(this.user);
                this._initialGmailSettings = cloneDeep(this.gmailSettings);
                this._initialSignatureHtml = this.signatureHtml;
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
        let input = new SendSMTPTestEmailInput();
        input.emailAddress = this.testEmailAddress;
        input.from = this.userEmailSettings.from;
        input.smtp = this.userEmailSettings.smtp;
        this.smtpProviderErrorLink = undefined;
        this.emailSmtpSettingsService.sendTestEmail(input,
            this.modalDialog.finishLoading.bind(this.modalDialog),
            () => this.checkHandlerErrorWarning()
        );
    }

    checkHandlerErrorWarning(forced = false) {
        this.smtpProviderErrorLink = (forced || this.testEmailAddress) &&
            this.emailSmtpSettingsService.getSmtpErrorHelpLink(this.userEmailSettings.smtp.host);
        if (this.smtpProviderErrorLink)
            this.changeDetectorRef.detectChanges();
    }

    isUserSettingsChanged(): boolean {
        return JSON.stringify(this._initialUserSettings) != JSON.stringify(this.user);
    }

    isEmailSettingsChanged(): boolean {
        return JSON.stringify(this.userEmailSettings) != JSON.stringify(this._initialEmailSettings);
    }

    isGmailSettingsChanged(): boolean {
        return JSON.stringify(this.gmailSettings) != JSON.stringify(this._initialGmailSettings);
    }

    isSignatureChanged(): boolean {
        return this._initialSignatureHtml != this.signatureHtml;
    }

    checkTabSwitchAllowed(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.currentTab == this.ls.l('SMTP')) {
                if (this.isEmailSettingsChanged())
                    this.messageService.confirm(this.ls.l('UnsavedChanges'), '', isConfirmed => {
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
                    this.messageService.confirm(this.ls.l('UnsavedChanges'), '', isConfirmed => {
                        if (isConfirmed) {
                            this.user = cloneDeep(this._initialUserSettings);
                            this.changeDetectorRef.detectChanges();
                        }
                        resolve(isConfirmed);
                    });
                else
                    resolve(true);
            } else if (this.currentTab == this.ls.l('Gmail')) {
                if (this.isGmailSettingsChanged())
                    this.messageService.confirm(this.ls.l('UnsavedChanges'), '', isConfirmed => {
                        if (isConfirmed) {
                            this.gmailSettings = cloneDeep(this._initialGmailSettings);
                            this.changeDetectorRef.detectChanges();
                        }
                        resolve(isConfirmed);
                    });
                else
                    resolve(true);
            } else if (this.currentTab == this.ls.l('Signature')) {
                if (this.isSignatureChanged())
                    this.messageService.confirm(this.ls.l('UnsavedChanges'), '', isConfirmed => {
                        if (isConfirmed) {
                            this.signatureHtml = cloneDeep(this._initialSignatureHtml);
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

    initGmailClient() {
        this.modalDialog.startLoading();
        this.googleService.getGmailSettings(true)
            .pipe(
                finalize(() => this.modalDialog.finishLoading())
            )
            .subscribe(res => {
                this.gmailSettings = res;
                this._initialGmailSettings = cloneDeep(this.gmailSettings);

                this.gmailSettingsService.initGmailClient(this.gmailSettings.clientId, (response) => {
                    this.modalDialog.startLoading();
                    this.googleService.setupGmail(true, response.code)
                        .pipe(
                            finalize(() => this.modalDialog.finishLoading())
                        )
                        .subscribe(() => {
                            this.initGmailClient();
                        });
                });

                this.changeDetectorRef.detectChanges();
            });
    }

    getAuthCode() {
        this.gmailSettingsService.getAuthCode();
    }

    disconnedGmail() {
        this.gmailSettingsService.disconnedGmail(true, () => {
            this.gmailSettings.isConfigured = this._initialGmailSettings.isConfigured = false;
            this.gmailSettings.isEnabled = this._initialGmailSettings.isEnabled = false;
            this.gmailSettings.defaultFromAddress = this._initialGmailSettings.defaultFromAddress = null;
            this.changeDetectorRef.detectChanges();
        });
    }

    sendGmailTestEmail(): void {
        if (!this.gmailSettings.isConfigured)
            return;

        this.gmailSettingsService.sendTestEmail(this.testEmailAddress, this.gmailSettings.defaultFromAddress, this.gmailSettings.defaultFromDisplayName, true);
    }

    onTabChanged(event) {
        this.currentTab = event.tab.textLabel;
        this.buttons[0].disabled = ![this.ls.l('SMTP'), this.ls.l('Profile'), this.ls.l('Gmail'), this.ls.l('Signature')].includes(this.currentTab);
        this.changeDetectorRef.detectChanges();
    }

    checkCloseAllowed = () => {
        return new Promise((resolve, reject) => {
            if (this.isUserSettingsChanged() || this.isEmailSettingsChanged() || this.isGmailSettingsChanged() || this.isSignatureChanged())
                this.messageService.confirm(this.ls.l('UnsavedChanges'), '', isConfirmed => {
                    resolve(isConfirmed);
                });
            else
                resolve(true);
        });
    }
}