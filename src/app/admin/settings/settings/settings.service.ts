/** Core imports */
import { Injectable } from '@angular/core';

@Injectable()
export class SettingService {
    public isDarkMode: boolean = false;
    public hasSubmenu: boolean = false;

    public supportedPaymentProviders = [
        {
            id: 'paypal',
            iconUrl: 'assets/settings/Icons/Paypal.svg',
        },
        {
            id: 'stripe',
            iconUrl: 'assets/settings/Icons/Stripe.svg',
        },
        {
            id: 'authorize',
            iconUrl: 'assets/settings/Icons/Authorize.Net.svg',
        },
        {
            id: 'razorpay',
            iconUrl: 'assets/settings/Icons/RazorPay.svg',
        },
        {
            id: 'paystack',
            iconUrl: 'assets/settings/Icons/PayStack.svg',
        },
        {
            id: 'adyen',
            iconUrl: 'assets/settings/Icons/Adyen.svg',
        },
        {
            id: 'mollie',
            iconUrl: 'assets/settings/Icons/Mollie.svg',
        },
        {
            id: 'coinbase',
            iconUrl: 'assets/settings/Icons/Coinbase.svg',
        },
        {
            id: 'zelle',
            iconUrl: 'assets/settings/Icons/Zelle.svg',
        },
        {
            id: 'ach',
            iconUrl: 'assets/settings/Icons/ACH Bank Transfer.svg',
        },
        {
            id: 'wire',
            iconUrl: 'assets/settings/Icons/Wire Transfer Instructions.svg',
        },
        {
            id: 'other',
            iconUrl: 'assets/settings/Icons/Other 100+ Providers.svg',
        },
    ];

    constructor(
    ) {
    }

    getFullPath = (path: string) => '/app/admin/settings/' + path;

    toggleTheme = () => {
        this.isDarkMode = !this.isDarkMode;
    }

    alterSubmenu = (v: boolean) => {
        this.hasSubmenu = v;
    }
}