/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    ViewChild,
    OnInit,
    AfterViewInit,
    ChangeDetectorRef,
    Injector
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Third party imports */
import { MatTabGroup } from '@angular/material/tabs';
import { forkJoin, Observable, throwError } from 'rxjs';
import { finalize, tap, catchError } from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';
import { Camera, FileSignature, KeyRound, Mail, UserCircle, Plus, Edit, Trash2, Link } from 'lucide-angular';
import { NotifyService } from 'abp-ng2-module';
import { SettingService } from 'abp-ng2-module';
import { MessageService } from 'abp-ng2-module';

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
import { EmailSmtpSettingsService } from '@shared/common/settings/email-smtp-settings.service';
import { GmailSettingsService } from '@shared/common/settings/gmail-settings.service';
import { CountryPhoneNumberComponent } from '@shared/common/phone-numbers/country-phone-number.component';
import { SettingsComponentBase } from '../settings-base.component';
import { SocialLinkData } from '@shared/social-dialog/components/social-dialog/social-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { SocialDialogComponent } from '@shared/social-dialog/components/social-dialog/social-dialog.component';

@Component({
    templateUrl: './personal-settings.component.html',
    styleUrls: ['./personal-settings.component.less', '../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        GoogleServiceProxy, 
        GmailSettingsService
    ]
})
export class PersonalSettingsComponent extends SettingsComponentBase implements OnInit, AfterViewInit {
    readonly UserIcon = UserCircle;
    readonly EmailIcon = Mail;
    readonly SignatureIcon = FileSignature;
    readonly KeyIcon = KeyRound;
    readonly CameraIcon = Camera;
    readonly PlusIcon = Plus;
    readonly EditIcon = Edit;
    readonly TrashIcon = Trash2;
    readonly LinkIcon = Link;

    @ViewChild('smsVerificationModal') smsVerificationModal: SmsVerificationModalComponent;
    @ViewChild(MatTabGroup) tabs: MatTabGroup;
    @ViewChild(CountryPhoneNumberComponent, { static: false }) phoneComponent: CountryPhoneNumberComponent;

    ckConfig: any = {
        enterMode: 3, /*CKEDITOR.ENTER_DIV*/
        height: innerHeight - 520 + 'px',
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
    
    // Social Links properties
    public socialLinks: SocialLinkData[] = [];
    public currentTab = this.l('Profile');
    public _initialUserSettings: any;
    public _initialEmailSettings: any;
    public _initialGmailSettings: GmailSettingsDto;
    public _initialSignatureHtml: string;
    private _initialTimezone: string = undefined;
    private testEmailAddress: string = undefined;
    buttons: IDialogButton[] = [
        {
            title: this.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    gmailSettings: GmailSettingsDto = new GmailSettingsDto();
    signatureHtml: string;

    smtpProviderErrorLink: string;
    supportedProviders = [
        ...this.emailSmtpSettingsService.supportedProviders,
        {
            name: 'Other Mail Provider',
            hosts: [''],
            port: '',
            ssl: false,
            domain: '',
            icon: 'email.svg',
            imap: { host: '', port: '', ssl: false }
        }
    ];
    selectedProvider: any;
    selectedIndex: number;

    constructor(
        _injector: Injector,
        private profileServiceProxy: ProfileServiceProxy,
        private appSessionService: AppSessionService,
        private notifyService: NotifyService,
        private messageService: MessageService,
        private settingService: SettingService,
        private emailSmtpSettingsService: EmailSmtpSettingsService,
        private changeDetectorRef: ChangeDetectorRef,
        private googleService: GoogleServiceProxy,
        private gmailSettingsService: GmailSettingsService,
        private route: ActivatedRoute,
        private dialog: MatDialog
    ) { 
        super(_injector);
    }

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
        this.profileServiceProxy.getEmailSettings().subscribe((settings: UserEmailSettings) => {
            this.userEmailSettings = settings;
            this.initUserEmailControls();
            this._initialEmailSettings = cloneDeep(this.userEmailSettings);
            this.changeDetectorRef.detectChanges();
        });
        this.profileServiceProxy.getCurrentUserProfileForEdit()
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
        this.profileServiceProxy.getSignatureHtml()
            .subscribe((result) => {
                this.signatureHtml = result;
                this._initialSignatureHtml = result;
            });

        this.testEmailAddress = this.appSessionService.user.emailAddress;

        // Initialize sample social links for testing
        this.initializeSampleSocialLinks();
        
        this.route.params.subscribe(params => {
            const tabIndexes = ['profile', 'smtp', 'gmail', 'signature', '2fa'];
            this.selectedIndex = tabIndexes.indexOf(params['id']);
        })
    }

    initUserEmailControls() {
        this.selectedProvider = null;
        if (this.userEmailSettings && this.userEmailSettings.smtp.host)
            this.selectedProvider = this.supportedProviders.find(item => item.hosts.includes(this.userEmailSettings.smtp.host.toLowerCase()));

        if (!this.selectedProvider) {
            this.selectedProvider = this.supportedProviders[this.supportedProviders.length - 1];
            if (!this.userEmailSettings.smtp.host)
                this.onProviderChanged();
        }

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
    }

    onProviderChanged(event = null) {
        if (event && !event.event)
            return;

        var providerHost = this.selectedProvider.hosts[0];
        if (providerHost) {
            this.userEmailSettings.smtp.host = providerHost;
            this.userEmailSettings.smtp.port = this.selectedProvider.port;
            this.userEmailSettings.smtp.enableSsl = this.selectedProvider.ssl;
            this.userEmailSettings.smtp.domain = this.selectedProvider.domain;
            this.userEmailSettings.imapHost = this.selectedProvider.imap.host;
            this.userEmailSettings.imapPort = this.selectedProvider.imap.port;
            this.userEmailSettings.imapUseSsl = this.selectedProvider.imap.ssl;
            this.userEmailSettings.isImapEnabled = false;
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

    updateQrCodeSetupImageUrl(): void {
        //this.profileServiceProxy.updateGoogleAuthenticatorKey().subscribe((result: UpdateGoogleAuthenticatorKeyOutput) => {
        //    this.user.qrCodeSetupImageUrl = result.qrCodeSetupImageUrl;
        //    this.isGoogleAuthenticatorEnabled = true;
        //    this.changeDetectorRef.detectChanges();
        //});
    }

    smsVerify(): void {
        this.profileServiceProxy.sendVerificationSms()
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

    getSaveObs (): Observable<any> {
        let saveObs: Observable<void>[] = [];
        if (this.currentTab == this.l('SMTP')) {
            if (!this.userEmailSettings.isImapEnabled) {
                this.userEmailSettings.imapHost = undefined;
                this.userEmailSettings.imapPort = undefined;
                this.userEmailSettings.imapUseSsl = undefined;
            }

            saveObs.push(this.profileServiceProxy.updateEmailSettings(this.userEmailSettings).pipe(tap(() => {
                sessionStorage.removeItem('SupportedFrom' + this.appSessionService.userId);
            })));
        }

        if (this.currentTab == this.l('Profile')) {
            if (this.phoneComponent && this.phoneComponent.isEmpty())
                this.user.phoneNumber = undefined;
            saveObs.push(this.profileServiceProxy.updateCurrentUserProfile(CurrentUserProfileEditDto.fromJS(this.user)));
        }
        if (this.currentTab == this.l('Gmail')) {
            let obj = new GmailSettingsEditDto();
            obj.init(this.gmailSettings);
            obj.forUser = true;
            saveObs.push(this.googleService.updateGmailSettings(obj).pipe(tap(() => {
                sessionStorage.removeItem('SupportedFrom' + this.appSessionService.userId);
            })));
        }
        if (this.currentTab == this.l('Signature')) {
            saveObs.push(this.profileServiceProxy.updateSignatureHtml(new UpdateSignatureDto({ signatureHtml: this.signatureHtml })));
        }

        return new Observable(subscribe => {
            forkJoin(saveObs)
                .pipe(
                    catchError(error => {
                        this.checkHandlerErrorWarning(true);
                        return throwError(error);
                    }),
                    finalize(() => {
                        subscribe.complete();
                    })
                )
                .subscribe(() => {
                    this.appSessionService.user.name = this.user.name;
                    this.appSessionService.user.surname = this.user.surname;
                    this.appSessionService.user.userName = this.user.name;
                    this.appSessionService.user.emailAddress = this.user.emailAddress;
                    this._initialEmailSettings = cloneDeep(this.userEmailSettings);
                    this._initialUserSettings = cloneDeep(this.user);
                    this._initialGmailSettings = cloneDeep(this.gmailSettings);
                    this._initialSignatureHtml = this.signatureHtml;
                    if (abp.clock.provider.supportsMultipleTimezone && this._initialTimezone !== this.user.timezone) {
                        this.messageService.info(this.l('TimeZoneSettingChangedRefreshPageNotification')).done(() => {
                            window.location.reload();
                        });
                    }

                    subscribe.next();
                });
        })
    }

    sendTestEmail(): void {
        let input = new SendSMTPTestEmailInput();
        input.emailAddress = this.testEmailAddress;
        input.from = this.userEmailSettings.from;
        input.smtp = this.userEmailSettings.smtp;
        this.smtpProviderErrorLink = undefined;
        this.emailSmtpSettingsService.sendTestEmail(input,
            () => {},
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
            if (this.currentTab == this.l('SMTP')) {
                if (this.isEmailSettingsChanged())
                    this.messageService.confirm(this.l('UnsavedChanges'), '', isConfirmed => {
                        if (isConfirmed) {
                            this.userEmailSettings = cloneDeep(this._initialEmailSettings);
                            this.initUserEmailControls();
                            this.changeDetectorRef.detectChanges();
                        }
                        resolve(isConfirmed);
                    });
                else
                    resolve(true);
            } else if (this.currentTab == this.l('Profile')) {
                if (this.isUserSettingsChanged())
                    this.messageService.confirm(this.l('UnsavedChanges'), '', isConfirmed => {
                        if (isConfirmed) {
                            this.user = cloneDeep(this._initialUserSettings);
                            this.changeDetectorRef.detectChanges();
                        }
                        resolve(isConfirmed);
                    });
                else
                    resolve(true);
            } else if (this.currentTab == this.l('Gmail')) {
                if (this.isGmailSettingsChanged())
                    this.messageService.confirm(this.l('UnsavedChanges'), '', isConfirmed => {
                        if (isConfirmed) {
                            this.gmailSettings = cloneDeep(this._initialGmailSettings);
                            this.changeDetectorRef.detectChanges();
                        }
                        resolve(isConfirmed);
                    });
                else
                    resolve(true);
            } else if (this.currentTab == this.l('Signature')) {
                if (this.isSignatureChanged())
                    this.messageService.confirm(this.l('UnsavedChanges'), '', isConfirmed => {
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
        this.googleService.getGmailSettings(true)
            .subscribe(res => {
                this.gmailSettings = res;
                this._initialGmailSettings = cloneDeep(this.gmailSettings);

                this.gmailSettingsService.initGmailClient(this.gmailSettings.clientId, (response) => {
                    this.googleService.setupGmail(true, response.code)
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
        this.buttons[0].disabled = ![this.l('SMTP'), this.l('Profile'), this.l('Gmail'), this.l('Signature'), 'Social Links'].includes(this.currentTab);
        this.changeDetectorRef.detectChanges();
    }

    checkCloseAllowed = () => {
        return new Promise((resolve, reject) => {
            if (this.isUserSettingsChanged() || this.isEmailSettingsChanged() || this.isGmailSettingsChanged() || this.isSignatureChanged())
                this.messageService.confirm(this.l('UnsavedChanges'), '', isConfirmed => {
                    resolve(isConfirmed);
                });
            else
                resolve(true);
        });
    }

    // Social Links Methods
    private initializeSampleSocialLinks(): void {
        // Sample data for testing - remove this in production
        this.socialLinks = [
            {
                id: '1',
                platform: 'BBB.org',
                url: 'https://www.bbb.org/sdfsdf',
                comment: 'Better Business Bureau profile',
                isActive: true,
                isConfirmed: false
            },
            {
                id: '2',
                platform: 'AngelList',
                url: 'https://angel.co/u/sdf',
                comment: 'AngelList profile',
                isActive: true,
                isConfirmed: false
            },
            {
                id: '3',
                platform: 'Twitch',
                url: 'https://twitch.com/',
                comment: 'Twitch channel',
                isActive: true,
                isConfirmed: false
            },
            {
                id: '4',
                platform: 'Vimeo',
                url: 'https://vimeo.com/vda',
                comment: 'Vimeo portfolio',
                isActive: true,
                isConfirmed: false
            }
        ];
    }

    addSocialLink(): void {
        const dialogRef = this.dialog.open(SocialDialogComponent, {
            width: '450px',
            data: {
                platform: '',
                url: '',
                comment: '',
                isActive: true,
                isConfirmed: false
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.log('Social dialog result received:', result);
                // Handle the result here - create a new social link
                this.socialLinks.push(result);
                this.changeDetectorRef.detectChanges();
            } else {
                console.log('Social dialog was cancelled');
            }
        });
    }

    editSocialLink(link: SocialLinkData): void {
        const dialogRef = this.dialog.open(SocialDialogComponent, {
            width: '450px',
            data: {
                id: link.id, // Pass ID for edit mode
                platform: link.platform || '',
                url: link.url || '',
                comment: link.comment || '',
                isActive: link.isActive !== undefined ? link.isActive : true,
                isConfirmed: link.isConfirmed || false
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.log('Social dialog edit result:', result);
                if (result.isEditMode) {
                    // Update existing link
                    const index = this.socialLinks.findIndex(l => l.id === link.id);
                    if (index !== -1) {
                        this.socialLinks[index] = result;
                        this.changeDetectorRef.detectChanges();
                    }
                } else {
                    // Handle as new link if somehow not in edit mode
                    this.socialLinks.push(result);
                    this.changeDetectorRef.detectChanges();
                }
            } else {
                console.log('Social dialog was cancelled');
            }
        });
    }

    deleteSocialLink(link: SocialLinkData): void {
        this.messageService.confirm(
            this.l('AreYouSure'),
            'Are you sure you want to delete this social link?',
            isConfirmed => {
                if (isConfirmed) {
                    const index = this.socialLinks.findIndex(l => l.id === link.id);
                    if (index !== -1) {
                        this.socialLinks.splice(index, 1);
                        this.changeDetectorRef.detectChanges();
                    }
                }
            }
        );
    }

    trackBySocialLink(index: number, link: SocialLinkData): string {
        return link.id || index.toString();
    }

    getPlatformColor(platformName: string): string {
        const platform = this.getPlatformByName(platformName);
        return platform ? platform.color : '#6B7280';
    }

    getPlatformIcon(platformName: string): string {
        const platform = this.getPlatformByName(platformName);
        return platform ? platform.icon : 'assets/images/platforms/globe.svg';
    }

    private getPlatformByName(platformName: string): any {
        // This would need to be imported from the platforms data
        // For now, returning a default platform object
        const platformColors: { [key: string]: string } = {
            'LinkedIn': '#0077B5',
            'Facebook': '#1877F2',
            'Twitter': '#1DA1F2',
            'Instagram': '#E4405F',
            'GitHub': '#181717',
            'BBB.org': '#1E4D8C',
            'AngelList': '#000000',
            'Twitch': '#9146FF',
            'Vimeo': '#1AB7EA'
        };
        
        return {
            color: platformColors[platformName] || '#6B7280',
            icon: `assets/images/platforms/${platformName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}.svg`
        };
    }
}