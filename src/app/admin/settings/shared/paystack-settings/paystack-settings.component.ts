/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { first, filter } from 'rxjs/operators';
import { 
    AlertCircle, ChevronDown, Copy, ExternalLink, Eye, EyeOff, 
    Info, Save 
} from 'lucide-angular';

/** Application imports */
import {
    CountryDto, 
    TenantPaymentSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { CountriesStoreSelectors, RootStore } from '@root/store';
import { SettingsComponentBase } from '../settings-base.component';

@Component({
    selector: 'paystack-settings',
    templateUrl: './paystack-settings.component.html',
    styleUrls: ['./paystack-settings.component.less', './../settings-base.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TenantPaymentSettingsServiceProxy]
})
export class PayStackSettingsComponent extends SettingsComponentBase {
    readonly CopyIcon = Copy
    readonly EyeIcon = Eye
    readonly EyeOffIcon = EyeOff
    readonly AlertIcon = AlertCircle
    readonly ExternalIcon = ExternalLink
    readonly ChevronIcon = ChevronDown;
    readonly InfoIcon = Info;
    readonly SaveIcon = Save;

    supportedCountries: CountryDto[];
    
    isEnabled: boolean = true;
    apiKeySettings: any = {
        id: '',
        secret: ''
    }
    showSecret: boolean[] = [false, false];
    faqs = [
        {
            title: "What is PayStack?",
            content: "PayStack is a payment processing company that allows businesses to accept payments online and via mobile directly from customers."
        },
        {
            title: "How do I get my PayStack API keys?",
            content: "Log in to your PayStack Dashboard, navigate to Settings > API Keys & Webhooks to find your public and secret keys."
        },
        {
            title: "Which countries does PayStack support?",
            content: "PayStack is available in Nigeria, Ghana, South Africa, and Kenya."
        },
        {
            title: "How much does PayStack cost?",
            content: "PayStack charges a fee of 1.5% + NGN 100 for local transactions in Nigeria. Rates may vary for other countries."
        },
        {
            title: "Is there a test mode in PayStack?",
            content: "Yes, PayStack provides test API keys for you to test your integration before going live."
        },
    ]

    constructor(
        _injector: Injector,
        private store$: Store<RootStore.State>,
    ) {
        super(_injector);
    }

    ngOnInit(): void {
        this.initCountries();
    }

    private initCountries() {
        this.store$.pipe(
            select(CountriesStoreSelectors.getCountries),
            filter(Boolean),
            first()
        ).subscribe((countries: CountryDto[]) => {
            this.supportedCountries = countries;
        });
    }

    getSaveObs(): Observable<any> {
        return;
    }

    copyToClipboard(value: string) {
        this.clipboardService.copyFromContent(value.trim());
        this.notify.info(this.l('SavedToClipboard'));
    }

    setShowSecret(key: number, value: boolean) {
        this.showSecret[key] = value;
    }
}