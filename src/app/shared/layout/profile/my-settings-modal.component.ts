import { AfterViewChecked, Component, ElementRef, EventEmitter, Injector, Output, ViewChild, OnInit } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppTimezoneScope } from '@shared/AppEnums';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { CurrentUserProfileEditDto, DefaultTimezoneScope, ProfileServiceProxy, UpdateGoogleAuthenticatorKeyOutput } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap';
import { SmsVerificationModalComponent } from './sms-verification-modal.component';
import { finalize } from 'rxjs/operators';
import { ModalDialogComponent } from 'shared/common/dialogs/modal/modal-dialog.component';
import { MatDialog } from '@angular/material';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';

@Component({
    templateUrl: './my-settings-modal.component.html',
    providers: [DialogService]
})
export class MySettingsModalComponent extends ModalDialogComponent implements AfterViewChecked, OnInit {
    @ViewChild('nameInput') nameInput: ElementRef;
    @ViewChild('smsVerificationModal') smsVerificationModal: SmsVerificationModalComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();
    
    public saving = false;
    public isGoogleAuthenticatorEnabled = false;
    public isPhoneNumberConfirmed: boolean;
    public isPhoneNumberEmpty = false;
    public smsEnabled: boolean;
    public user: CurrentUserProfileEditDto;
    public showTimezoneSelection: boolean = abp.clock.provider.supportsMultipleTimezone;
    public canChangeUserName: boolean;
    public defaultTimezoneScope: DefaultTimezoneScope = AppTimezoneScope.User;
    private _initialTimezone: string = undefined;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _profileService: ProfileServiceProxy,
        private _appSessionService: AppSessionService
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
    }

    ngAfterViewChecked(): void {
        //Temporary fix for: https://github.com/valor-software/ngx-bootstrap/issues/1508
        $('tabset ul.nav').addClass('m-tabs-line');
        $('tabset ul.nav li a.nav-link').addClass('m-tabs__link');
    }

    ngOnInit() {
        super.ngOnInit();
        
        this.data.title = this.l("MySettings");
        this.data.editTitle = false;
        this.data.titleClearButton = false;
        this.data.placeholder = this.l('MySettings');
        
        this.data.buttons = [{
            title: this.l('Save'),
            class: 'primary menu',
            action: this.save.bind(this)
        }];

        this._profileService.getCurrentUserProfileForEdit().subscribe((result) => {
            this.smsEnabled = this.setting.getBoolean('App.UserManagement.SmsVerificationEnabled');
            this.user = result;
            this._initialTimezone = result.timezone;
            this.canChangeUserName = this.user.name !== AppConsts.userManagement.defaultAdminUserName;
            this.isGoogleAuthenticatorEnabled = result.isGoogleAuthenticatorEnabled;
            this.isPhoneNumberConfirmed = result.isPhoneNumberConfirmed;
            this.isPhoneNumberEmpty = result.phoneNumber === '';
        });
    }
    
    updateQrCodeSetupImageUrl(): void {
        this._profileService.updateGoogleAuthenticatorKey().subscribe((result: UpdateGoogleAuthenticatorKeyOutput) => {
            this.user.qrCodeSetupImageUrl = result.qrCodeSetupImageUrl;
            this.isGoogleAuthenticatorEnabled = true;
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
    }
    
    save(): void {
        this.saving = true;
        this._profileService.updateCurrentUserProfile(this.user)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this._appSessionService.user.name = this.user.name;
                this._appSessionService.user.surname = this.user.surname;
                this._appSessionService.user.userName = this.user.name;
                this._appSessionService.user.emailAddress = this.user.emailAddress;

                this.notify.info(this.l('SavedSuccessfully'));
                this.close(true);
                this.modalSave.emit(null);

                if (abp.clock.provider.supportsMultipleTimezone && this._initialTimezone !== this.user.timezone) {
                    this.message.info(this.l('TimeZoneSettingChangedRefreshPageNotification')).done(() => {
                        window.location.reload();
                    });
                }
            });
    }
}
