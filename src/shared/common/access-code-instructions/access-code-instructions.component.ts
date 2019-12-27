/** Core imports */
import { Component } from '@angular/core';

/** Third party imports  */
import { map } from '@node_modules/rxjs/internal/operators';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { NotifyService } from '@abp/notify/notify.service';
import { Observable } from '@node_modules/rxjs';

@Component({
    selector: 'access-code-instructions',
    templateUrl: 'access-code-instructions.component.html',
    styleUrls: ['./access-code-instructions.component.less'],
    providers: [ ClipboardService ]
})
export class AccessCodeInstructionsComponent {
    accessCode$: Observable<string> = this.profileService.accessCode$;
    trackingLink$: Observable<string> = this.accessCode$.pipe(
        map((accessCode: string) => 'https://www.CrackMyCode.com/?ref=' + accessCode)
    );
    affiliateLink$: Observable<string> = this.accessCode$.pipe(
        map((accessCode: string) => 'https://www.CodebreakerTech.com/?ref=' + accessCode)
    );
    constructor(
        private profileService: ProfileService,
        private clipboardService: ClipboardService,
        private notifyService: NotifyService,
        public ls: AppLocalizationService
    ) {}

    copy(value: string) {
        this.clipboardService.copyFromContent(value);
        this.notifyService.info(this.ls.l('Copied'));
    }

}