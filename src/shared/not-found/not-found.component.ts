import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LayoutType } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.less'],
})
export class NotFoundComponent {
    lendSpaceLayout = this._appSession.tenant && this._appSession.tenant.customLayoutType === LayoutType.LendSpace;
    constructor(
        private _location: Location,
        private _appSession: AppSessionService
    ) { }

    goBack() {
        this._location.back();
    }
}
