/** Core imports */
import { Component } from '@angular/core';
import { Location } from '@angular/common';

/** Application imports */
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LayoutType } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.less'],
})
export class NotFoundComponent {
    lendSpaceLayout = this.location.path().includes('personal-finance') &&
        this.appSession.tenant && this.appSession.tenant.customLayoutType === LayoutType.LendSpace;
    constructor(
        private location: Location,
        private appSession: AppSessionService
    ) { }

    goBack() {
        this.location.back();
    }
}
