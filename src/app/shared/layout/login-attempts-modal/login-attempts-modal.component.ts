/** Core imports */
import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import * as moment from 'moment';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { UserLoginAttemptDto, UserLoginServiceProxy } from '@shared/service-proxies/service-proxies';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'loginAttemptsModal',
    templateUrl: './login-attempts-modal.component.html',
    styleUrls: [
        '../../../../shared/metronic/m-alert.less',
        '../../../../shared/metronic/m-helpers.less',
        './login-attempts-modal.component.less'
    ],
    providers: [ DialogService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginAttemptsModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    userLoginAttempts: UserLoginAttemptDto[];
    profileThumbnailId: string;

    constructor(
        private userLoginService: UserLoginServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        private appSession: AppSessionService,
        public ls: AppLocalizationService,
        public profileService: ProfileService
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        this.userLoginService.getRecentUserLoginAttempts()
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(result => {
                this.userLoginAttempts = result.items;
                this.profileThumbnailId = this.appSession.user.profileThumbnailId;
                this.changeDetectorRef.detectChanges();
            });
    }

    getLoginAttemptTime(userLoginAttempt: UserLoginAttemptDto): string {
        return moment(userLoginAttempt.creationTime).fromNow() + ' (' + moment(userLoginAttempt.creationTime).format('YYYY-MM-DD hh:mm:ss') + ')';
    }
}
