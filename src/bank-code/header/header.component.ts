import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { AppConsts } from '../../shared/AppConsts';

@Component({
    selector: 'header',
    templateUrl: 'header.component.html',
    styleUrls: ['header.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
    remoteServiceBaseUrl: string = AppConsts.remoteServiceBaseUrl;
    loggedUserId = abp.session.userId;
    constructor(
        private router: Router,
        public appSession: AppSessionService,
        public ls: AppLocalizationService
    ) {}

    logoClick() {
        if (this.loggedUserId)
            this.router.navigate(['/code-breaker']);
        else
            location.href = location.origin;
    }
}