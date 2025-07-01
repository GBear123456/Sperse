/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { ChevronDown, CreditCard, ExternalLink, House, Info, Settings, 
    Shield, TestTube 
} from 'lucide-angular'

/** Application imports */
import {
    GetStripeSettingsDto,
    StripeSettingsDto,
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from '../settings-base.component';

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
    readonly InfoIcon = Info;
    readonly ExternalIcon = ExternalLink;
    readonly ChevronIcon = ChevronDown;

    authorizeNetPaymentSettings: GetStripeSettingsDto = new GetStripeSettingsDto();
    checked: boolean = true;
    faqs = [
        {
            title: "What is Authorize.Net?",
            content: "Authorize.Net is a payment gateway service provider that allows merchants to accept credit card and electronic check payments online, in person, over the phone, and through mobile devices."
        },
        {
            title: "How do I get my Authorize.Net API credentials?",
            content: "Log in to your Authorize.Net merchant interface, go to Account > Settings > Security Settings > API Credentials & Keys to generate or retrieve your API Login ID and Transaction Key. The Public Client Key can be found under Account > Settings > Security Settings > Manage Public Client Key."
        },
        {
            title: "What's the difference between sandbox and production?",
            content: "The sandbox environment is for testing your integration without processing actual payments. Once you're ready to go live, switch to the production environment with your live API credentials."
        },
        {
            title: "How can I test my integration?",
            content: "Authorize.Net provides a sandbox environment with test credentials. You can use test card numbers like 4111 1111 1111 1111 with any future expiration date and any 3-digit CVV to test successful transactions."
        },
    ]

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