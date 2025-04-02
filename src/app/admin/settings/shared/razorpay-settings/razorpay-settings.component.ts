/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { AlertCircle, ChevronDown, Copy, ExternalLink, Eye, EyeOff } from 'lucide-angular';

/** Application imports */
import { TenantPaymentSettingsServiceProxy } from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from '../settings-base.component';

@Component({
    selector: 'razorpay-settings',
    templateUrl: './razorpay-settings.component.html',
    styleUrls: ['./razorpay-settings.component.less', './../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantPaymentSettingsServiceProxy]
})
export class RazorPaySettingsComponent extends SettingsComponentBase {
    readonly CopyIcon = Copy
    readonly EyeIcon = Eye
    readonly EyeOffIcon = EyeOff
    readonly AlertIcon = AlertCircle
    readonly ExternalIcon = ExternalLink
    readonly ChevronIcon = ChevronDown;

    isEnabled: boolean = true;
    apiKeySettings: any = {
        id: '',
        secret: ''
    }
    showSecret: boolean = false;
    faqs = [
        {
            title: "What is RazorPay?",
            content: "RazorPay is a popular Indian payment gateway that enables businesses to accept, process, and disburse payments with ease. It offers a comprehensive suite of payment solutions including payment gateway, payment links, payment pages, subscriptions, and more."
        },
        {
            title: "How do I get RazorPay credentials?",
            content: "Sign up at razorpay.com and create a business account. After verification, navigate to Settings > API Keys in your RazorPay Dashboard to generate API keys (Key ID and Key Secret)."
        },
        {
            title: "Do I need to set up webhooks?",
            content: "Yes, webhooks are recommended to receive real-time notifications about payment events. Add the webhook URL provided above to your RazorPay dashboard under Settings > Webhooks."
        },
        {
            title: "What payment methods does RazorPay support?",
            content: "RazorPay supports various payment methods including credit/debit cards, UPI, net banking, wallets, EMI options, and international payments."
        },
        {
            title: "Is there a test mode in RazorPay?",
            content: "Yes, RazorPay provides a test mode where you can simulate payments without actual money transfers. Use test credentials from your dashboard to test your integration before going live."
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
        return;
    }

    copyToClipboard(value: string) {
        this.clipboardService.copyFromContent(value.trim());
        this.notify.info(this.l('SavedToClipboard'));
    }

    setShowSecret(value: boolean) {
        this.showSecret = value;
    }
}