/** Core imports */
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

/** Third party imports */
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { environment } from '@root/environments/environment';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Injectable()
export class ProductsService {

    constructor(
        private profileService: ProfileService,
        private sanitizer: DomSanitizer
    ) {}

    private getLink(route: string, secureId: string) {
        return this.sanitizer.bypassSecurityTrustUrl({
            development: 'https://wp.bankcode.pro/' + route + '?WPSecureID=' + secureId,
            production: 'https://codebreakertech.com/' + route + '?WPSecureID=' + secureId,
            staging: 'https://wp.bankcode.pro/' + route + '?WPSecureID=' + secureId,
            beta: 'https://wp.bankcode.pro/' + route + '?WPSecureID=' + secureId
        }[environment.releaseStage]);
    }

    getResourceLink(route): Observable<SafeUrl> {
        return this.profileService.secureId$.pipe(
            map((secureId: string) => this.getLink(route, secureId))
        );
    }
}