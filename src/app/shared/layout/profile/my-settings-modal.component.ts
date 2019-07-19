/** Core imports */
import {
    AfterViewChecked,
    Component,
    ChangeDetectionStrategy,
    ElementRef,
    EventEmitter,
    Output,
    ViewChild,
    OnInit,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope } from '@shared/AppEnums';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { CurrentUserProfileEditDto, SettingScopes, ProfileServiceProxy, UpdateGoogleAuthenticatorKeyOutput } from '@shared/service-proxies/service-proxies';
import { SmsVerificationModalComponent } from './sms-verification-modal.component';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { SettingService } from '@abp/settings/setting.service';
import { MessageService } from '@abp/message/message.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { finalize } from '@node_modules/rxjs/internal/operators';

@Component({
    templateUrl: './my-settings-modal.component.html',
    styleUrls: [
        '../../../../shared/metronic/navbar.less',
        '../../../../shared/metronic/m-nav.less',
        './my-settings-modal.component.less'
    ],
    providers: [ DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MySettingsModalComponent implements AfterViewChecked, OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild('nameInput') nameInput: ElementRef;
    @ViewChild('smsVerificationModal') smsVerificationModal: SmsVerificationModalComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    public isGoogleAuthenticatorEnabled = false;
    public isPhoneNumberConfirmed: boolean;
    public isPhoneNumberEmpty = false;
    public smsEnabled: boolean;
    public user: CurrentUserProfileEditDto;
    public showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    public canChangeUserName: boolean;
    public defaultTimezoneScope: SettingScopes = AppTimezoneScope.User;
    private _initialTimezone: string = undefined;
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('SaveAndClose'),
            class: 'primary menu',
            action: this.save.bind(this)
        }
    ];
    constructor(
        private dialog: MatDialog,
        private _profileService: ProfileServiceProxy,
        private _appSessionService: AppSessionService,
        private _notifyService: NotifyService,
        private _messageService: MessageService,
        private _settingService: SettingService,
        private _changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {}

    ngAfterViewChecked(): void {
        //Temporary fix for: https://github.com/valor-software/ngx-bootstrap/issues/1508
        $('tabset ul.nav').addClass('m-tabs-line');
        $('tabset ul.nav li a.nav-link').addClass('m-tabs__link');
    }

    ngOnInit() {
        this.modalDialog.startLoading();
        this._profileService.getCurrentUserProfileForEdit()
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result) => {
                this.smsEnabled = this._settingService.getBoolean('App.UserManagement.SmsVerificationEnabled');
                this.user = result;
                this._initialTimezone = result.timezone;
                this.canChangeUserName = this.user.name !== AppConsts.userManagement.defaultAdminUserName;
                this.isGoogleAuthenticatorEnabled = result.isGoogleAuthenticatorEnabled;
                this.isPhoneNumberConfirmed = result.isPhoneNumberConfirmed;
                this.isPhoneNumberEmpty = result.phoneNumber === '';
                this._changeDetectorRef.detectChanges();
            });
    }

    updateQrCodeSetupImageUrl(): void {
        this._profileService.updateGoogleAuthenticatorKey().subscribe((result: UpdateGoogleAuthenticatorKeyOutput) => {
            this.user.qrCodeSetupImageUrl = result.qrCodeSetupImageUrl;
            this.isGoogleAuthenticatorEnabled = true;
            this._changeDetectorRef.detectChanges();
        });
    }

    smsVerify(): void {
        this._profileService.sendVerificationSms()
            .subscribe(() => {
                this.smsVerificationModal.show();
            });
    }

    changePhoneNumberToVerified(): void {
        this.isPhoneNumberConfirmed = true;
        this._changeDetectorRef.detectChanges();
    }

    save(): void {
        this.modalDialog.startLoading()
        this._profileService.updateCurrentUserProfile(this.user)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this._appSessionService.user.name = this.user.name;
                this._appSessionService.user.surname = this.user.surname;
                this._appSessionService.user.userName = this.user.name;
                this._appSessionService.user.emailAddress = this.user.emailAddress;
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this.modalDialog.close(true);
                this.modalSave.emit(null);
                if (abp.clock.provider.supportsMultipleTimezone && this._initialTimezone !== this.user.timezone) {
                    this._messageService.info(this.ls.l('TimeZoneSettingChangedRefreshPageNotification')).done(() => {
                        window.location.reload();
                    });
                }
            });
    }
}
