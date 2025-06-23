/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Title } from '@angular/platform-browser';

/** Third party imports  */
import { Observable } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { ClipboardService } from 'ngx-clipboard';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { NotifyService } from 'abp-ng2-module';
import { environment } from '@root/environments/environment';

@Component({
    selector: 'access-code-instructions',
    templateUrl: 'access-code-instructions.component.html',
    styleUrls: ['./access-code-instructions.component.less'],
    providers: [ ClipboardService ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccessCodeInstructionsComponent {
    accessCode$: Observable<string> = this.profileService.accessCode$;
    trackingLink$: Observable<string> = this.accessCode$.pipe(
        withLatestFrom(this.router.queryParamMap.pipe(
            map((paramMap: ParamMap) => paramMap.get('tracking-link'))
        )),
        map(([accessCode, trackingLink]: [string, string]) => {
            return (
                trackingLink
                ? trackingLink
                : (environment.releaseStage === 'production'
                    ? (location.href.indexOf('successfactory.com') >= 0
                        ? 'https://sf.crackmycode.com'
                        : 'https://bp.crackmycode.com')
                    : 'https://bankpass.bankcode.pro'
                )
            ) + '/' + accessCode;
        })
    );

    constructor(
        private profileService: ProfileService,
        private clipboardService: ClipboardService,
        private notifyService: NotifyService,
        private router: ActivatedRoute,
        public ls: AppLocalizationService
    ) {}

    copy(value: string) {
        this.clipboardService.copyFromContent(value);
        this.notifyService.info(this.ls.l('Copied'));
    }
}
