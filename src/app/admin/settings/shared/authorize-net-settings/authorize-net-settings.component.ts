/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import {
    GetStripeSettingsDto,
    StripeSettingsDto,
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from '../settings-base.component';
import { CreditCard, ExternalLink, House, Info, Settings, Shield, TestTube } from 'lucide-angular'

@Component({
    selector: 'authorize-net-settings',
    templateUrl: './authorize-net-settings.component.html',
    styleUrls: ['./authorize-net-settings.component.less', './../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizeNetSettingsComponent extends SettingsComponentBase {
    readonly HouseIcon = House;
    readonly SettingsIcon = Settings;
    readonly TestTubeIcon = TestTube;
    readonly ShieldIcon = Shield;
    readonly CreditCardIcon = CreditCard;
    readonly InfoIcon = Info
    readonly ExternalIcon = ExternalLink

    authorizeNetPaymentSettings: GetStripeSettingsDto = new GetStripeSettingsDto();
    checked: boolean = true;

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

    createConnectedAccount(setting: StripeSettingsDto) {
        if (this.isHost || (setting && setting.isConnectedAccountSetUpCompleted))
            return;

        this.message.confirm('', this.l('Do you want to connect Stripe account ?'), (isConfirmed) => {
            if (isConfirmed) {
                window.location.reload();
            }
        });
    }
}