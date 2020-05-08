/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { environment } from '../../../environments/environment';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    selector: 'subscriptions',
    templateUrl: 'subscriptions.component.html',
    styleUrls: ['subscriptions.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionsComponent {
    dataIsLoading = true;
    link$: Observable<SafeResourceUrl> = this.profileService.secureId$.pipe(
        map((secureId: string) => {
            return this.sanitizer.bypassSecurityTrustResourceUrl((environment.releaseStage === 'production'
                ? 'https://codebreakertech.com/my-account.html/subscriptions/?WPSecureID='
                : 'https://wp.bankcode.pro/my-account/subscriptions/?WPSecureID=') + secureId);
        })
    );
    constructor(
        private profileService: ProfileService,
        private sanitizer: DomSanitizer
    ) {}

    onIframeLoad(e) {
        if (e.target.src !== '') {
            this.dataIsLoading = false;
        }
    }
}