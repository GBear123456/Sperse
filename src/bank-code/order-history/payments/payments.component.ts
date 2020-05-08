/** Core imports */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { ProfileService } from '../../../shared/common/profile-service/profile.service';
import { environment } from '@root/environments/environment';

@Component({
    selector: 'payments',
    templateUrl: 'payments.component.html',
    styleUrls: ['payments.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsComponent {
    dataIsLoading = true;
    link$: Observable<SafeResourceUrl> = this.profileService.secureId$.pipe(
        map((secureId: string) => {
            return this.sanitizer.bypassSecurityTrustResourceUrl((environment.releaseStage === 'production'
                ? 'https://codebreakertech.com/my-account.html/payment-methods/?WPSecureID='
                : 'https://wp.bankcode.pro/my-account/payment-methods/?WPSecureID=') + secureId);
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