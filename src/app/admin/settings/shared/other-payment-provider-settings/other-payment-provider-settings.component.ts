/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { 
    Building, ChevronDown, CreditCard, Globe, LineChart, LockKeyhole, 
    Shield, Wallet, Zap 
} from 'lucide-angular';

/** Application imports */
import {
    TenantPaymentSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from '../settings-base.component';

@Component({
    selector: 'other-payment-provider-settings',
    templateUrl: './other-payment-provider-settings.component.html',
    styleUrls: ['./other-payment-provider-settings.component.less', './../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantPaymentSettingsServiceProxy]
})
export class OtherProviderSettingsComponent extends SettingsComponentBase {
    readonly ChevronIcon = ChevronDown;
    readonly GlobeIcon = Globe;
    readonly ShieldIcon = Shield;
    readonly KeyIcon = LockKeyhole;
    readonly ZapIcon = Zap;
    readonly CardIcon = CreditCard;
    readonly LineChartIcon = LineChart;

    isEnabled: boolean = true;
    apiKeySettings: any = {
        id: '',
        secret: ''
    }
    showSecret: boolean = false;
    faqs = [
        {
            title: "Do I have to vault credit cards?",
            content: "Yes. A credit card token is never tied to any one gateway. Once you have the token for that payment method, you can run transactions against any of the gateways you have on file."
        },
        {
            title: "Will you give me my credit card data back if I wish to change services?",
            content: "Yes. We believe it's your data, not ours. Given this is sensitive data it will need to be transferred in a secure fashion to another fully certified PCI organization."
        },
        {
            title: "Do you ever hold my funds directly?",
            content: "No. We never touch your money. Instead, money flows from your customer to your gateway/merchant account."
        },
        {
            title: "What currencies do you support?",
            content: "We support the underlying currencies that your particular payment gateway(s) supports."
        },
        {
            title: "Do you support recurring/subscription payments?",
            content: "You can vault the cards so that you can charge the same card again in the future. So, in that sense we support recurring charges. However, you have to create the rules and code around when you want to re-charge those cards."
        },
        {
            title: "Do you support ACH payments?",
            content: "You can add bank accounts as payment methods to be used with a gateway's eCheck service. We currently support this feature through our supported gateways."
        },
        {
            title: "Do you provide merchant account services?",
            content: "No. You must have an existing merchant account to use our platform via one of our supported gateways. We have several relationships with Merchant providers and can help you get the right account."
        },
        {
            title: "What is PCI and how does it affect my business?",
            content: "PCI DSS (Payment Card Industry Data Security Standard) is a set of security standards designed to ensure all companies that accept, process, store or transmit credit card information maintain a secure environment. It affects any business that handles payment card data, requiring compliance to avoid potential penalties and to protect customer information."
        },
        {
            title: "Are you PCI Compliant, and how do you reduce my PCI compliance scope?",
            content: "Yes, we are PCI compliant. For higher level PCI compliance, we rely on our upstream providers and Payment Partners. By using a transparent redirect, we ensure that sensitive data never touches your servers, significantly reducing your PCI compliance scope."
        },
    ]

    paymentMethods = [
        { name: "PayPal", type: "Payment Method", status: "Preferred Partner", icon: Wallet },
        { name: "ACH Direct Debit", type: "Payment Method", status: "", icon: Building },
        { name: "Affirm", type: "Payment Method", status: "", icon: CreditCard },
        { name: "Afterpay and Clearpay", type: "Payment Method", status: "", icon: CreditCard },
        { name: "Alipay", type: "Payment Method", status: "", icon: Wallet },
        { name: "American Express", type: "Payment Method", status: "", icon: CreditCard },
        { name: "Apple Pay", type: "Payment Method", status: "", icon: Wallet },
        { name: "BACS Direct Debit", type: "Payment Method", status: "", icon: Building },
        { name: "Bancontact", type: "Payment Method", status: "", icon: CreditCard },
        { name: "Blik", type: "Payment Method", status: "", icon: Wallet },
        { name: "Boleto Bancario", type: "Payment Method", status: "", icon: Building },
        { name: "Click to Pay", type: "Payment Method", status: "", icon: CreditCard },
        { name: "Diners Club", type: "Payment Method", status: "", icon: CreditCard },
        { name: "Discover", type: "Payment Method", status: "", icon: CreditCard },
        { name: "Google Pay", type: "Payment Method", status: "", icon: Wallet },
        { name: "JCB", type: "Payment Method", status: "", icon: CreditCard },
        { name: "Klarna", type: "Payment Method", status: "", icon: CreditCard },
        { name: "Mastercard", type: "Payment Method", status: "", icon: CreditCard },
        { name: "Paypal Credit", type: "Payment Method", status: "", icon: CreditCard },
        { name: "Union Pay", type: "Payment Method", status: "", icon: CreditCard },
        { name: "Venmo", type: "Payment Method", status: "", icon: Wallet },
        { name: "Visa", type: "Payment Method", status: "", icon: CreditCard },
        { name: "WeChat Pay", type: "Payment Method", status: "", icon: Wallet }
    ];
    
    paymentGateways = [
        { name: "CyberSource", status: "Preferred Partner" },
        { name: "PayPal", status: "Preferred Partner" },
        { name: "Stripe", status: "Preferred Partner" },
        { name: "WorldPay", status: "Preferred Partner" },
        { name: "Barclaycard Smartpay", status: "Featured Partner" },
        { name: "BlueSnap", status: "Featured Partner" },
        { name: "CardConnect", status: "Featured Partner" },
        { name: "Credorax", status: "Featured Partner" },
        { name: "EBANX", status: "Featured Partner" },
        { name: "Elavon", status: "Featured Partner" },
        { name: "Forter", status: "Featured Partner" },
        { name: "Kount", status: "Featured Partner" },
        { name: "Kushki", status: "Featured Partner" },
        { name: "MercadoPago", status: "Featured Partner" },
        { name: "Nuvei (formerly SafeCharge)", status: "Featured Partner" },
        { name: "PPRO", status: "Featured Partner" },
        { name: "PayU Latam", status: "Featured Partner" },
        { name: "Payflow Pro", status: "Featured Partner" },
        { name: "Paysafe", status: "Featured Partner" },
        { name: "Pin Payments", status: "Featured Partner" },
        { name: "ProPay", status: "Featured Partner" },
        { name: "Rapyd", status: "Featured Partner" },
        { name: "Reach", status: "Featured Partner" },
        { name: "Worldline", status: "Featured Partner" },
        { name: "Authorize.Net", status: "" },
        { name: "Adyen", status: "" },
        { name: "Braintree", status: "" },
        { name: "Checkout.com", status: "" },
        { name: "First Data Global Gateway", status: "" }
    ];

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