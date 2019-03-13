import { Component, Injector, OnInit } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { UserLoginAttemptDto, UserLoginServiceProxy } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';

@Component({
    selector: 'loginAttemptsModal',
    templateUrl: './login-attempts-modal.component.html',
    styleUrls: ['./login-attempts-modal.component.less'],
    providers: [DialogService]
})
export class LoginAttemptsModalComponent extends AppModalDialogComponent implements OnInit {

    userLoginAttempts: UserLoginAttemptDto[];
    profileThumbnailId: string;

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private _userLoginService: UserLoginServiceProxy
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.defaultLocalizationSourceName;
    }

    ngOnInit() {
        super.ngOnInit();

        this.data.title = this.l('LoginAttempts');
        this.data.editTitle = false;
        this.data.titleClearButton = false;
        this.data.placeholder = this.l('LoginAttempts');

        this.data.buttons = [];

        this._userLoginService.getRecentUserLoginAttempts().subscribe(result => {
            this.userLoginAttempts = result.items;
            this.profileThumbnailId = this.appSession.user.profileThumbnailId;
        });
    }

    getLoginAttemptTime(userLoginAttempt: UserLoginAttemptDto): string {
        return moment(userLoginAttempt.creationTime).fromNow() + ' (' + moment(userLoginAttempt.creationTime).format('YYYY-MM-DD hh:mm:ss') + ')';
    }
}
