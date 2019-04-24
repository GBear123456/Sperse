import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UserLoginAttemptDto, UserLoginServiceProxy } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Component({
    selector: 'loginAttemptsModal',
    templateUrl: './login-attempts-modal.component.html',
    styleUrls: ['./login-attempts-modal.component.less'],
    providers: [ DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginAttemptsModalComponent implements OnInit {
    userLoginAttempts: UserLoginAttemptDto[];
    profileThumbnailId: string;

    constructor(
        private _userLoginService: UserLoginServiceProxy,
        private _changeDetectorRef: ChangeDetectorRef,
        private _appSession: AppSessionService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this._userLoginService.getRecentUserLoginAttempts().subscribe(result => {
            this.userLoginAttempts = result.items;
            this.profileThumbnailId = this._appSession.user.profileThumbnailId;
            this._changeDetectorRef.detectChanges();
        });
    }

    getLoginAttemptTime(userLoginAttempt: UserLoginAttemptDto): string {
        return moment(userLoginAttempt.creationTime).fromNow() + ' (' + moment(userLoginAttempt.creationTime).format('YYYY-MM-DD hh:mm:ss') + ')';
    }
}
