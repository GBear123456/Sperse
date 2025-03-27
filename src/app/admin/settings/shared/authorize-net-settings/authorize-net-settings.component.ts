/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import {
    GetStripeSettingsDto,
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from '../settings-base.component';

@Component({
    selector: 'authorize-net-settings',
    templateUrl: './authorize-net-settings.component.html',
    styleUrls: ['./authorize-net-settings.component.less', './../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizeNetSettingsComponent extends SettingsComponentBase {
    authorizeNetPaymentSettings: GetStripeSettingsDto = new GetStripeSettingsDto();

    constructor(
        _injector: Injector,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
    }

    getSaveObs(): Observable<any> {
        return
    }
}