/** Core imports */
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import {
    StripeSettingsDto, TenantPaymentSettingsServiceProxy
} from '@shared/service-proxies/service-proxies';
import { SettingsComponentBase } from '../settings-base.component';
import { AlertCircle, Copy, ExternalLink, Eye, EyeOff } from 'lucide-angular';

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

    isEnabled: boolean = true;
    apiKeySettings: any = {
        id: '',
        secret: ''
    }
    showSecret: boolean = false;

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